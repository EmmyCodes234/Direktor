import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { toast } from 'sonner';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { motion } from 'framer-motion';

const AnnouncementsManager = () => {
  const { tournamentSlug } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);

  useEffect(() => {
    if (!tournamentSlug) return;

    const fetchTournamentAndAnnouncements = async () => {
      const { data: tournamentData, error: tError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('slug', tournamentSlug)
        .single();

      if (tError) {
        toast.error('Failed to load tournament for announcements.');
        return;
      }

      const id = tournamentData.id;
      setTournamentId(id);

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('tournament_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AnnouncementsManager] Fetch Error:', error);
      } else {
        setAnnouncements(data);
      }
    };

    fetchTournamentAndAnnouncements();

    const channel = supabase
      .channel(`announcements-${tournamentSlug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements', filter: `tournament_id=eq.${tournamentId}` },
        (payload) => {
          fetchTournamentAndAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentSlug, tournamentId]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !tournamentId) return;

    setLoading(true);
    const { error } = await supabase
      .from('announcements')
      .insert({
        tournament_id: tournamentId,
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
    <div className="bg-card/90 backdrop-blur-sm border border-border/10 rounded-xl">
      <div className="p-4 sm:p-5 lg:p-6 border-b border-border/10">
        <h3 className="font-heading font-semibold text-foreground flex items-center space-x-2">
          <Icon name="Megaphone" size={18} className="text-primary" />
          <span className="text-base sm:text-lg">Director's Announcements</span>
        </h3>
      </div>
      <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
        <form onSubmit={handlePostAnnouncement} className="space-y-3 sm:space-y-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your announcement here..."
            className="w-full h-24 p-4 bg-input border border-border/10 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 touch-target"
            disabled={loading}
          />
          <Button 
            type="submit" 
            loading={loading} 
            className="w-full touch-target"
            size="lg"
          >
            <Icon name="Send" size={16} className="mr-2" />
            Post Announcement
          </Button>
        </form>
        
        <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto">
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Megaphone" size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            </div>
          ) : (
            announcements.map((ann, index) => (
              <motion.div 
                key={ann.id} 
                className="bg-muted/10 p-4 sm:p-5 rounded-xl border border-border/10 group touch-target"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm sm:text-base text-foreground leading-relaxed">{ann.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ann.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="touch-target p-2 sm:p-3 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete announcement"
                  >
                    <Icon name="Trash2" size={16} className="text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsManager;