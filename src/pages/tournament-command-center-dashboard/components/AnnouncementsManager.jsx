import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { toast } from 'sonner';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AnnouncementsManager = () => {
  const { tournamentId } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;

    // --- FIX: Convert tournamentId to a number upfront for consistency ---
    const numericTournamentId = parseInt(tournamentId, 10);

    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('tournament_id', numericTournamentId) // Use the numeric ID
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch announcements.');
      } else {
        setAnnouncements(data);
      }
    };

    fetchAnnouncements();

    const channel = supabase
      .channel(`announcements-${tournamentId}`)
      // --- FIX: Use the numeric ID in the real-time filter ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements', filter: `tournament_id=eq.${numericTournamentId}` },
        (payload) => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('announcements')
      .insert({
        tournament_id: parseInt(tournamentId, 10), // Use the numeric ID
        message: newMessage.trim(),
      });

    if (error) {
      toast.error(`Failed to post announcement: ${error.message}`);
    } else {
      toast.success('Announcement Posted!');
      setNewMessage('');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(`Failed to delete announcement: ${error.message}`);
    } else {
        toast.success('Announcement deleted.');
    }
  };

  return (
    <div className="glass-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-heading font-semibold text-foreground flex items-center space-x-2">
          <Icon name="Megaphone" size={18} className="text-primary" />
          <span>Director's Announcements</span>
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <form onSubmit={handlePostAnnouncement} className="space-y-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your announcement here..."
            className="w-full h-24 p-3 bg-input border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
          <Button type="submit" loading={loading} className="w-full">
            Post Announcement
          </Button>
        </form>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-muted/10 p-3 rounded-lg flex justify-between items-start group">
              <div>
                <p className="text-sm text-foreground">{ann.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(ann.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(ann.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="Trash2" size={14} className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsManager;