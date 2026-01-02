
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const CollaboratorManager = ({ tournamentId, isOwner }) => {
    const [collaborators, setCollaborators] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (tournamentId) fetchCollaborators();
    }, [tournamentId]);

    const fetchCollaborators = async () => {
        try {
            const { data, error } = await supabase
                .from('tournament_collaborators')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCollaborators(data);
        } catch (error) {
            console.error('Error fetching collaborators:', error);
            // toast.error('Failed to load collaborators'); 
            // Silently fail if RLS blocks read (e.g. non-owners might strictly see nothing)
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviting(true);
        try {
            // Check if already invited
            if (collaborators.some(c => c.email.toLowerCase() === inviteEmail.toLowerCase())) {
                toast.error('User already added');
                return;
            }

            const { data, error } = await supabase
                .from('tournament_collaborators')
                .insert([{
                    tournament_id: tournamentId,
                    email: inviteEmail.trim(),
                    role: 'editor'
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success('Collaborator added');
            setCollaborators([data, ...collaborators]);
            setInviteEmail('');
        } catch (error) {
            console.error('Error adding collaborator:', error);
            toast.error('Failed to add collaborator');
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (id, email) => {
        if (!confirm(`Remove access for ${email}?`)) return;

        try {
            const { error } = await supabase
                .from('tournament_collaborators')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Collaborator removed');
            setCollaborators(collaborators.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error removing collaborator:', error);
            toast.error('Failed to remove collaborator');
        }
    };

    if (!isOwner) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Collaboration</CardTitle>
                    <CardDescription>
                        Only the tournament owner can manage collaborators.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Collaborators</CardTitle>
                <CardDescription>
                    Invite other directors to help manage this tournament.
                    They must log in with the email address you invite.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleInvite} className="flex gap-2 mb-6">
                    <input
                        type="email"
                        placeholder="Enter email address"
                        className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" disabled={inviting || !inviteEmail}>
                        {inviting ? 'Adding...' : 'Add'}
                    </Button>
                </form>

                <div className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : collaborators.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No collaborators added yet.</p>
                    ) : (
                        collaborators.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Icon name="User" size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{c.email}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{c.role}</div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(c.id, c.email)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Icon name="Trash2" size={16} />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CollaboratorManager;
