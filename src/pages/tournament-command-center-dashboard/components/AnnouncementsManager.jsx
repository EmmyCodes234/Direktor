import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { toast } from 'sonner';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';

const AnnouncementsManager = ({ compact = false }) => {
  const { tournamentSlug } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // For compact modal

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

  const Content = () => (
    <div className="bg-slate-900 border-0 sm:border border-slate-800 h-full flex flex-col">
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <h3 className="font-heading font-semibold text-slate-100 flex items-center space-x-2">
          <Icon name="Megaphone" size={18} className="text-emerald-500" />
          <span className="text-base sm:text-lg uppercase tracking-wider">Director's Announcements</span>
        </h3>
        {compact && (
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Icon name="X" size={20} />
          </button>
        )}
      </div>
      <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
        <form onSubmit={handlePostAnnouncement} className="space-y-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Broadcast a message to all players..."
            className="w-full h-28 p-4 bg-slate-950 border border-slate-800 rounded-xl resize-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm text-slate-300 placeholder:text-slate-600"
            disabled={loading}
          />
          <Button
            type="submit"
            loading={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
            variant="primary"
            size="lg"
          >
            <Icon name="Send" size={16} className="mr-2" />
            Post Announcement
          </Button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-[1px] flex-1 bg-slate-800" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Recent Logs</span>
            <div className="h-[1px] flex-1 bg-slate-800" />
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="Megaphone" size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No active broadcasts.</p>
            </div>
          ) : (
            announcements.map((ann, index) => (
              <motion.div
                key={ann.id}
                className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 group hover:border-slate-700 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">{ann.message}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <Icon name="Clock" size={10} />
                      <span>{new Date(ann.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="p-1.5 rounded-md text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Delete announcement"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} icon="Megaphone">
          Announcements
        </Button>
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[85vh] flex flex-col bg-slate-900 border-0 sm:border border-slate-800 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Content />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return <Content />;
};

export default AnnouncementsManager;