import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import PublicLoadingScreen from '../../components/public/PublicLoadingScreen';
import { toast } from 'sonner';

const VolunteerScoreEntry = ({ tournamentId, user }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [scores, setScores] = useState({ p1: '', p2: '' });

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: matchesData, error: matchesError } = await supabase
                .from('matches')
                .select(`
                    *,
                    player1:players!player1_id(id, name, rating),
                    player2:players!player2_id(id, name, rating)
                `)
                .eq('tournament_id', tournamentId)
                .order('round', { ascending: false });

            if (matchesError) throw matchesError;
            setMatches(matchesData);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load matches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tournamentId) fetchData();
    }, [tournamentId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTable) return;

        const p1Score = parseInt(scores.p1);
        const p2Score = parseInt(scores.p2);

        if (isNaN(p1Score) || isNaN(p2Score)) {
            toast.error("Please enter valid scores");
            return;
        }

        setSubmitting(true);
        try {
            // Insert Result
            const { error: resultError } = await supabase
                .from('results')
                .insert([{
                    tournament_id: tournamentId,
                    round: selectedTable.round,
                    match_id: selectedTable.id,
                    player1_id: selectedTable.player1_id,
                    player2_id: selectedTable.player2_id,
                    score1: p1Score,
                    score2: p2Score,
                    player1_name: selectedTable.player1?.name,
                    player2_name: selectedTable.player2?.name
                }]);

            if (resultError) throw resultError;

            // Update Match Status
            const { error: matchError } = await supabase
                .from('matches')
                .update({ status: 'complete' })
                .eq('id', selectedTable.id);

            if (matchError) throw matchError;

            toast.success(`Score submitted for match #${selectedTable.id}`);
            setSelectedTable(null);
            setScores({ p1: '', p2: '' });
            fetchData();

        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to submit score: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <PublicLoadingScreen variant="dark" />;

    const pendingMatches = matches.filter(m => m.status !== 'complete');
    const completedMatchesCursor = matches.filter(m => m.status === 'complete').slice(0, 5);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Volunteer Mode</h1>
                    <p className="text-slate-400">Score Entry Terminal</p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                    Live Access
                </div>
            </div>

            {/* Entry Form */}
            <Card className="border-emerald-500/20 bg-slate-900/50">
                <CardHeader>
                    <CardTitle>Submit Result</CardTitle>
                </CardHeader>
                <CardContent>
                    {!selectedTable ? (
                        <div className="grid gap-4">
                            <label className="text-sm font-medium text-slate-300">Select Match to Score:</label>
                            {pendingMatches.length === 0 ? (
                                <div className="p-8 text-center border border-dashed rounded-lg border-slate-800 text-slate-500">
                                    No pending matches found.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
                                    {pendingMatches.map(match => (
                                        <button
                                            key={match.id}
                                            onClick={() => setSelectedTable(match)}
                                            className="flex flex-col items-start p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left"
                                        >
                                            <div className="flex justify-between w-full mb-2">
                                                <span className="text-xs font-bold text-emerald-500">Match #{match.id}</span>
                                                <span className="text-xs text-slate-500">Round {match.round}</span>
                                            </div>
                                            <div className="w-full space-y-1">
                                                <div className="text-sm text-slate-200">{match.player1?.name || 'Player 1'}</div>
                                                <div className="text-xs text-slate-500">vs</div>
                                                <div className="text-sm text-slate-200">{match.player2?.name || 'Player 2'}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <Button variant="ghost" onClick={() => setSelectedTable(null)} size="sm" className="text-slate-400 hover:text-white">
                                    <Icon name="ArrowLeft" size={16} className="mr-2" /> Back
                                </Button>
                                <div className="text-center">
                                    <span className="block text-xs text-slate-500 uppercase tracking-widest">Match #{selectedTable.id}</span>
                                    <span className="block text-emerald-500 font-bold">Round {selectedTable.round}</span>
                                </div>
                                <div className="w-20"></div>
                            </div>

                            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
                                <div className="grid grid-cols-2 gap-8 items-center">
                                    <div className="text-center space-y-2">
                                        <div className="h-12 w-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                                            {selectedTable.player1?.name?.[0] || '1'}
                                        </div>
                                        <div className="text-sm font-bold text-slate-200 truncate">
                                            {selectedTable.player1?.name}
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full text-center bg-slate-950 border border-slate-800 rounded-lg py-3 text-2xl font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                            placeholder="0"
                                            value={scores.p1}
                                            onChange={(e) => setScores({ ...scores, p1: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="text-center pt-8">
                                        <span className="text-slate-600 font-bold text-xl italic">VS</span>
                                    </div>

                                    <div className="text-center space-y-2">
                                        <div className="h-12 w-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                                            {selectedTable.player2?.name?.[0] || '2'}
                                        </div>
                                        <div className="text-sm font-bold text-slate-200 truncate">
                                            {selectedTable.player2?.name}
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full text-center bg-slate-950 border border-slate-800 rounded-lg py-3 text-2xl font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                            placeholder="0"
                                            value={scores.p2}
                                            onChange={(e) => setScores({ ...scores, p2: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide mt-8"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Final Score'}
                                </Button>
                            </form>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity */}
            {completedMatchesCursor.length > 0 && (
                <div className="space-y-4 opacity-75">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Recent Entries</h3>
                    {completedMatchesCursor.map(match => (
                        <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/50">
                            <span className="text-xs font-mono text-slate-500">#{match.id}</span>
                            <div className="flex-1 px-4 flex items-center justify-center gap-4 text-sm text-slate-400">
                                <span>{match.player1?.name}</span>
                                <span className="font-bold text-slate-200">Def</span>
                                <span>{match.player2?.name}</span>
                            </div>
                            <Icon name="CheckCircle" size={14} className="text-emerald-500" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VolunteerScoreEntry;
