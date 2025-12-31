
import { useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

/**
 * Hook for tournament actions (Score Submission, Round Completion, Unpairing).
 */
const useTournamentActions = (tournamentInfo, setTournamentInfo, players, setResults, setMatches) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Submit or Edit a Score
     */
    const submitResult = useCallback(async (resultData) => {
        setIsSubmitting(true);
        try {
            const { player1, player2, score1, score2, isEditing, existingId } = resultData;

            // Validate inputs
            if (!player1 || !player2) throw new Error("Invalid players.");
            if (isNaN(score1) || isNaN(score2)) throw new Error("Invalid scores.");

            // Spread Cap
            let finalScore1 = score1;
            let finalScore2 = score2;
            const maxSpread = tournamentInfo?.max_spread;
            if (maxSpread && Math.abs(score1 - score2) > maxSpread) {
                toast.info(`Spread capped at ${maxSpread}.`);
                if (score1 > score2) finalScore2 = score1 - maxSpread;
                else finalScore1 = score2 - maxSpread;
            }

            const payload = {
                tournament_id: tournamentInfo.id,
                round: resultData.round || tournamentInfo.currentRound,
                player1_id: player1.player_id,
                player2_id: player2.player_id,
                score1: finalScore1,
                score2: finalScore2,
                player1_name: player1.name,
                player2_name: player2.name,
                is_bye: resultData.is_bye || false,
                is_forfeit: resultData.is_forfeit || false,
                match_id: resultData.match_id || null
            };

            let returnedResult;

            if (isEditing && existingId) {
                const { data, error } = await supabase
                    .from('results')
                    .update(payload)
                    .eq('id', existingId)
                    .select()
                    .single();
                if (error) throw error;
                returnedResult = data;
                toast.success("Result updated successfully!");

                // Optimistic update
                setResults(prev => prev.map(r => r.id === existingId ? data : r));

            } else {
                const { data, error } = await supabase
                    .from('results')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                returnedResult = data;
                toast.success("Result submitted successfully!");

                // Optimistic update
                setResults(prev => [data, ...prev]);
            }

            // Handle Best of League Match Completion Logic
            if (tournamentInfo?.type === 'best_of_league' && payload.match_id) {
                // Fetch all results for this match to determine if it's complete
                const { data: matchResults } = await supabase
                    .from('results')
                    .select('*')
                    .eq('match_id', payload.match_id);

                // Logic to check win condition (best of X)
                const bestOf = Math.ceil((tournamentInfo.best_of_value || 15) / 2);

                // Helper to count wins
                const countWins = (pid) => matchResults?.filter(r =>
                    (r.player1_id === pid && r.score1 > r.score2) ||
                    (r.player2_id === pid && r.score2 > r.score1)
                ).length || 0;

                const p1Wins = countWins(player1.player_id);
                const p2Wins = countWins(player2.player_id);

                let winnerId = null;
                if (p1Wins >= bestOf) winnerId = player1.player_id;
                else if (p2Wins >= bestOf) winnerId = player2.player_id;

                if (winnerId) {
                    await supabase.from('matches').update({ winner_id: winnerId, status: 'complete' }).eq('id', payload.match_id);
                    setMatches(prev => prev.map(m => m.id === payload.match_id ? { ...m, status: 'complete', winner_id: winnerId } : m));
                    toast.success("Match complete!");
                }
            }

            return returnedResult;

        } catch (error) {
            console.error("Result submission error:", error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [tournamentInfo, setResults, setMatches]);

    /**
     * Unpair the last round
     */
    const unpairRound = useCallback(async () => {
        if (!tournamentInfo?.pairing_schedule) return;
        const rounds = Object.keys(tournamentInfo.pairing_schedule).map(Number);
        if (rounds.length === 0) return;

        const roundToUnpair = Math.max(...rounds);
        setIsSubmitting(true);
        toast.info(`Unpairing Round ${roundToUnpair}...`);

        try {
            // Delete results for this round
            const { error: deleteError } = await supabase.from('results').delete().eq('tournament_id', tournamentInfo.id).eq('round', roundToUnpair);
            if (deleteError) throw deleteError;

            // Remove from schedule
            const newSchedule = { ...tournamentInfo.pairing_schedule };
            delete newSchedule[roundToUnpair];

            const { data, error: updateError } = await supabase
                .from('tournaments')
                .update({ pairing_schedule: newSchedule })
                .eq('id', tournamentInfo.id)
                .select()
                .single();

            if (updateError) throw updateError;

            setTournamentInfo(data);
            // Remove local results for this round
            setResults(prev => prev.filter(r => r.round !== roundToUnpair));
            toast.success(`Round ${roundToUnpair} unpaired.`);

        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [tournamentInfo, setTournamentInfo, setResults]);

    /**
     * Complete Round / Tournament
     */
    const completeRound = useCallback(async () => {
        setIsSubmitting(true);
        try {
            const currentRound = tournamentInfo.currentRound || 1;
            const totalRounds = tournamentInfo.rounds;
            const isFinal = currentRound >= totalRounds;

            const payload = isFinal ? { status: 'completed' } : { currentRound: currentRound + 1 };

            const { data, error } = await supabase.from('tournaments').update(payload).eq('id', tournamentInfo.id).select().single();
            if (error) throw error;

            setTournamentInfo(data);
            toast.success(isFinal ? "Tournament Completed!" : `Advanced to Round ${currentRound + 1}`);

        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [tournamentInfo, setTournamentInfo]);

    return {
        isSubmitting,
        submitResult,
        unpairRound,
        completeRound
    };
};

export default useTournamentActions;
