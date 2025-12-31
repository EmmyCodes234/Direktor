import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

/**
 * Hook to manage tournament data fetching and real-time subscriptions.
 * 
 * @param {string} tournamentSlug - The slug of the tournament to fetch.
 * @returns {Object} { tournamentInfo, players, results, matches, teams, pendingResults, loading, error, refresh }
 */
const useTournamentData = (tournamentSlug) => {
    const [tournamentInfo, setTournamentInfo] = useState(() => {
        const cached = localStorage.getItem(`direktor_cache_${tournamentSlug}`);
        if (cached) return JSON.parse(cached).tournamentInfo;
        return null;
    });
    const [players, setPlayers] = useState(() => {
        const cached = localStorage.getItem(`direktor_cache_${tournamentSlug}`);
        if (cached) return JSON.parse(cached).players || [];
        return [];
    });
    const [results, setResults] = useState(() => {
        const cached = localStorage.getItem(`direktor_cache_${tournamentSlug}`);
        if (cached) return JSON.parse(cached).results || [];
        return [];
    });
    const [matches, setMatches] = useState(() => {
        const cached = localStorage.getItem(`direktor_cache_${tournamentSlug}`);
        if (cached) return JSON.parse(cached).matches || [];
        return [];
    });
    const [teams, setTeams] = useState([]);
    const [pendingResults, setPendingResults] = useState([]);
    const [loading, setLoading] = useState(() => {
        // If we have cache, don't show initial loader
        return !localStorage.getItem(`direktor_cache_${tournamentSlug}`);
    });
    const [error, setError] = useState(null);

    // Use a ref to track if we're mounted to avoid state updates on unmount
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchTournamentData = useCallback(async () => {
        if (!tournamentSlug) {
            setLoading(false);
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("You must be logged in to access this page.");
            }

            const { data: tournamentData, error: tErr } = await supabase
                .from('tournaments')
                .select(`*, tournament_players(*, players(id, name, rating, photo_url, slug))`)
                .eq('slug', tournamentSlug)
                .single();

            if (tErr || !tournamentData) {
                console.error("Error fetching tournament data:", tErr);
                throw tErr || new Error("Tournament not found");
            }

            // Security check: Ensure user owns this tournament
            if (tournamentData.user_id !== session.user.id) {
                throw new Error("You don't have permission to access this tournament's admin dashboard.");
            }

            // Helper to merge tournament_players with profile data
            const combinedPlayers = tournamentData.tournament_players.map(tp => ({
                ...tp.players,
                ...tp
            }));

            // Parallel fetching of related data
            const promises = [
                supabase.from('results').select('*').eq('tournament_id', tournamentData.id).order('created_at', { ascending: false }),
                supabase.from('pending_results').select('*').eq('tournament_id', tournamentData.id).eq('status', 'pending').order('created_at', { ascending: true }),
                supabase.from('teams').select('*').eq('tournament_id', tournamentData.id),
                supabase.from('matches').select('*').eq('tournament_id', tournamentData.id),
                supabase.from('player_photos').select('*').eq('tournament_id', tournamentData.id)
            ];

            const [
                { data: resultsData, error: resultsError },
                { data: pendingData, error: pendingError },
                { data: teamsData, error: teamsError },
                { data: matchesData, error: matchesError },
                { data: photosData, error: photosError }
            ] = await Promise.all(promises);

            if (resultsError) console.error("Error fetching results:", resultsError);
            if (pendingError) console.error("Error fetching pending results:", pendingError);
            if (teamsError) console.error("Error fetching teams:", teamsError);
            if (matchesError) console.error("Error fetching matches:", matchesError);

            // Combine results - Cleaned to avoid match tallies duplicates in Best of League
            const allResults = resultsData || [];

            // Attach photos to players
            const playersWithPhotos = combinedPlayers.map(player => {
                const photo = photosData?.find(p => p.player_id === player.player_id);
                return {
                    ...player,
                    photo_url: photo?.photo_url || null
                };
            });

            if (isMounted.current) {
                setTournamentInfo(tournamentData);
                setPlayers(playersWithPhotos);
                setResults(allResults);
                setPendingResults(pendingData || []);
                setTeams(teamsData || []);
                setMatches(matchesData || []);
                setLoading(false);

                // Update Cache
                localStorage.setItem(`direktor_cache_${tournamentSlug}`, JSON.stringify({
                    tournamentInfo: tournamentData,
                    players: playersWithPhotos,
                    results: allResults,
                    matches: matchesData
                }));
            }

        } catch (err) {
            console.error("Error in useTournamentData:", err);
            if (isMounted.current) {
                setError(err);
                setLoading(false);
                toast.error(`Failed to load data: ${err.message}`);
            }
        }
    }, [tournamentSlug]);

    // Initial fetch
    useEffect(() => {
        fetchTournamentData();
    }, [fetchTournamentData]);

    // Real-time Subscriptions
    useEffect(() => {
        if (!tournamentInfo?.id) return;

        const channel = supabase.channel(`dashboard-updates-${tournamentInfo.id}`)
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                const { table, eventType, new: newRecord, old: oldRecord } = payload;
                if (!isMounted.current) return;

                switch (table) {
                    case 'results':
                        setResults(prev => {
                            if (eventType === 'INSERT') {
                                if (prev.some(r => r.id === newRecord.id)) return prev;
                                return [newRecord, ...prev];
                            }
                            if (eventType === 'UPDATE') return prev.map(r => r.id === newRecord.id ? newRecord : r);
                            if (eventType === 'DELETE') return prev.filter(r => r.id !== oldRecord.id);
                            return prev;
                        });
                        break;
                    case 'pending_results':
                        setPendingResults(prev => {
                            if (eventType === 'INSERT') {
                                if (prev.some(r => r.id === newRecord.id)) return prev;
                                return [...prev, newRecord];
                            }
                            if (eventType === 'DELETE') return prev.filter(r => r.id !== oldRecord.id);
                            return prev;
                        });
                        break;
                    case 'tournaments':
                        if (newRecord.id === tournamentInfo.id) {
                            setTournamentInfo(prev => ({ ...prev, ...newRecord }));
                        }
                        break;
                    case 'tournament_players':
                        if (eventType === 'UPDATE') {
                            setPlayers(prev => prev.map(p =>
                                p.player_id === newRecord.player_id ? { ...p, ...newRecord } : p
                            ));
                        }
                        break;
                    case 'matches':
                        setMatches(prev => {
                            if (eventType === 'INSERT') return [...prev, newRecord];
                            if (eventType === 'UPDATE') return prev.map(m => m.id === newRecord.id ? newRecord : m);
                            return prev;
                        });
                        break;
                    default:
                        break;
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tournamentInfo?.id]);

    return {
        tournamentInfo,
        setTournamentInfo, // Exposed for optimistic updates if needed
        players,
        setPlayers,
        results,
        setResults,
        matches,
        setMatches,
        teams,
        pendingResults,
        setPendingResults,
        loading,
        error,
        refresh: fetchTournamentData
    };
};

export default useTournamentData;
