import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from 'supabaseClient';

const TestDataDisplay = () => {
    const { tournamentSlug } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!tournamentSlug) return;
            
            try {
                setLoading(true);
                
                // Fetch tournament data
                const { data: tournamentData, error: tErr } = await supabase
                    .from('tournaments')
                    .select(`*, tournament_players(*, players(id, name, rating, photo_url, slug))`)
                    .eq('slug', tournamentSlug)
                    .single();

                if (tErr || !tournamentData) {
                    console.error("Error fetching tournament data:", tErr);
                    throw tErr || new Error("Tournament not found");
                }

                // Fetch all related data
                const [{ data: resultsData }, { data: matchesData }] = await Promise.all([
                    supabase.from('results').select('*').eq('tournament_id', tournamentData.id),
                    supabase.from('matches').select('*').eq('tournament_id', tournamentData.id)
                ]);

                setData({
                    tournament: tournamentData,
                    results: resultsData,
                    matches: matchesData
                });
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tournamentSlug]);

    if (loading) return <div>Loading...</div>;
    
    if (!data) return <div>No data found</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Test Data Display</h1>
            
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Tournament Info</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(data.tournament, null, 2)}
                </pre>
            </div>
            
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Results ({data.results?.length || 0})</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(data.results, null, 2)}
                </pre>
            </div>
            
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Matches ({data.matches?.length || 0})</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(data.matches, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default TestDataDisplay;