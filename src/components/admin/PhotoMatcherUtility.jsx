import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import Fuse from 'fuse.js';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Icon from '../AppIcon';
import { Card, CardHeader, CardContent } from '../ui/Card';

const PhotoMatcherUtility = ({ tournamentId, players, onComplete }) => {
    const [matches, setMatches] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    // Initial Fuse setup for fuzzy matching
    // We search on keys: ['name', 'id', 'slug']
    // ID is priority if exact match
    const fuse = new Fuse(players, {
        keys: ['name', 'slug'],
        threshold: 0.4, // 0.0 is perfect match, 1.0 is match anything
        includeScore: true
    });

    const handleZipUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setMatches([]);

        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            const totalFiles = Object.keys(contents.files).length;
            let processed = 0;
            const newMatches = [];

            // Filter for images only
            const imageFiles = Object.keys(contents.files).filter(filename =>
                !contents.files[filename].dir &&
                /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
            );

            if (imageFiles.length === 0) {
                toast.error("No image files found in the zip.");
                setProcessing(false);
                return;
            }

            for (const filename of imageFiles) {
                const fileData = contents.files[filename];
                const blob = await fileData.async('blob');
                const fileUrl = URL.createObjectURL(blob);

                // --- Matching Logic ---
                const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');

                // 1. Exact ID Match (if filename is purely numeric or UUID-like)
                // Assuming IDs might be passed as filenames
                let bestMatch = players.find(p => String(p.id) === nameWithoutExt || String(p.player_id) === nameWithoutExt);
                let matchType = bestMatch ? 'EXACT_ID' : null;

                // 2. Exact Name Match (Cleaning underscores/hyphens)
                if (!bestMatch) {
                    const cleanName = nameWithoutExt.replace(/[_-]/g, ' ').toLowerCase();
                    bestMatch = players.find(p => p.name.toLowerCase() === cleanName);
                    if (bestMatch) matchType = 'EXACT_NAME';
                }

                // 3. Fuzzy Match
                if (!bestMatch) {
                    const cleanName = nameWithoutExt.replace(/[_-]/g, ' ');
                    const fuzzyResults = fuse.search(cleanName);
                    if (fuzzyResults.length > 0) {
                        bestMatch = fuzzyResults[0].item;
                        matchType = 'FUZZY';
                        // Keep score for UI indication? fuzzyResults[0].score
                    }
                }

                newMatches.push({
                    id: Math.random().toString(36).substr(2, 9), // temp id for list
                    file: blob,
                    filename: filename,
                    previewUrl: fileUrl,
                    suggestedPlayerId: bestMatch ? (bestMatch.player_id || bestMatch.id) : '',
                    matchType: matchType,
                    confirmed: !!bestMatch // Auto-check if we found a match? Or force manual confirm? Let's auto-check exacts.
                });

                processed++;
                setProgress(Math.round((processed / imageFiles.length) * 100));
            }

            setMatches(newMatches);
            toast.success(`Processed ${newMatches.length} images.`);

        } catch (error) {
            console.error(error);
            toast.error("Failed to process zip file.");
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirmToggle = (matchId) => {
        setMatches(prev => prev.map(m =>
            m.id === matchId ? { ...m, confirmed: !m.confirmed } : m
        ));
    };

    const handlePlayerChange = (matchId, newPlayerId) => {
        setMatches(prev => prev.map(m =>
            m.id === matchId ? { ...m, suggestedPlayerId: newPlayerId, confirmed: true } : m
        ));
    };

    const handleConfirmAll = () => {
        setMatches(prev => prev.map(m => ({ ...m, confirmed: !!m.suggestedPlayerId })));
    };

    const handleSave = async () => {
        const confirmedMatches = matches.filter(m => m.confirmed && m.suggestedPlayerId);
        if (confirmedMatches.length === 0) {
            toast.error("No confirmed matches to save.");
            return;
        }

        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (const match of confirmedMatches) {
            try {
                // 1. Upload to Supabase Storage
                // Path: tournament_photos/{tournamentId}/{playerId}-{timestamp}.ext
                const ext = match.filename.split('.').pop();
                const filePath = `tournament_photos/${tournamentId}/${match.suggestedPlayerId}-${Date.now()}.${ext}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('player-photos') // Ensure this bucket exists
                    .upload(filePath, match.file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('player-photos')
                    .getPublicUrl(filePath);

                // 3. Update Player Record
                // Updating 'players' table or 'tournament_players'? Usually global 'players' table has photo.
                const { error: dbError } = await supabase
                    .from('players')
                    .update({ photo_url: publicUrl })
                    .eq('id', match.suggestedPlayerId);

                if (dbError) throw dbError;

                successCount++;

            } catch (err) {
                console.error(`Failed to save ${match.filename}`, err);
                failCount++;
            }
        }

        setUploading(false);
        toast.info(`Saved ${successCount} photos. ${failCount > 0 ? `${failCount} failed.` : ''}`);
        if (onComplete) onComplete();
    };

    return (
        <Card className="bg-card border border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                    <Icon name="Camera" size={18} /> Bulk Photo Matcher
                </h3>
            </CardHeader>
            <CardContent className="pt-6">

                {/* Upload Area */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Upload Zip of Photos</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept=".zip"
                            onChange={handleZipUpload}
                            disabled={processing || uploading}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary/10 file:text-primary
                                hover:file:bg-primary/20"
                        />
                        {processing && <span className="text-sm text-muted-foreground">Processing... {progress}%</span>}
                    </div>
                </div>

                {/* Grid */}
                {matches.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm text-muted-foreground">{matches.length} Files Found</h4>
                            <div className="space-x-2">
                                <Button variant="outline" size="sm" onClick={handleConfirmAll}>Confirm All Assigned</Button>
                                <Button size="sm" onClick={handleSave} loading={uploading} disabled={uploading}>Save Confirmed ({matches.filter(m => m.confirmed).length})</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto p-1">
                            {matches.map(match => (
                                <div key={match.id} className={`flex items-start gap-3 p-3 rounded-lg border ${match.confirmed ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
                                    <div className="relative">
                                        <img src={match.previewUrl} alt="preview" className="w-16 h-16 object-cover rounded bg-muted" />
                                        {/* Status Dot */}
                                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${match.matchType === 'EXACT_ID' ? 'bg-green-500' :
                                                match.matchType === 'EXACT_NAME' ? 'bg-blue-500' :
                                                    match.matchType === 'FUZZY' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`} title={match.matchType || 'No Match'}></div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-muted-foreground truncate mb-1" title={match.filename}>{match.filename}</div>

                                        <select
                                            className="w-full text-sm rounded border border-input bg-background px-2 py-1 h-8"
                                            value={match.suggestedPlayerId}
                                            onChange={(e) => handlePlayerChange(match.id, e.target.value)}
                                        >
                                            <option value="">-- No Match --</option>
                                            {players.map(p => (
                                                <option key={p.id || p.player_id} value={p.id || p.player_id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="pt-5">
                                        <input
                                            type="checkbox"
                                            checked={match.confirmed}
                                            onChange={() => handleConfirmToggle(match.id)}
                                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PhotoMatcherUtility;
