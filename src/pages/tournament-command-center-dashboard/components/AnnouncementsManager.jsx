import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import { toast } from 'sonner';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import useMediaQuery from '../../../hooks/useMediaQuery';

const AnnouncementsManager = ({ compact = false }) => {
  const { tournamentSlug } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 640px)');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!tournamentSlug) return;

    const fetchData = async () => {
      const { data: tData, error: tError } = await supabase.from('tournaments').select('id').eq('slug', tournamentSlug).single();
      if (tError) return;

      setTournamentId(tData.id);

      const { data } = await supabase.from('announcements').select('*').eq('tournament_id', tData.id).order('created_at', { ascending: false });
      setAnnouncements(data || []);
    };

    fetchData();

    const channel = supabase
      .channel(`announcements-${tournamentSlug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tournamentSlug]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !tournamentId) return;

    setLoading(true);
    const { error } = await supabase.from('announcements').insert({ tournament_id: tournamentId, message: newMessage.trim() });

    if (error) toast.error(error.message);
    else {
      setNewMessage('');
      // Scroll to top or show success
      toast.success('Posted');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Deleted');
  };

  const Content = () => (
    <div className="flex flex-col h-full bg-slate-950 sm:bg-transparent">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Icon name="Megaphone" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">Announcements</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Broadcast Center</p>
          </div>
        </div>
        {compact && (
          <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
            <Icon name="X" size={24} />
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/30">
        {announcements.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500/50 space-y-4">
            <Icon name="BellOff" size={48} strokeWidth={1} />
            <p className="text-sm font-medium">No announcements yet</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-slate-900 border border-white/5 p-4 rounded-xl shadow-sm hover:border-emerald-500/20 transition-all"
            >
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed mb-3">{ann.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(ann.created_at).toLocaleDateString()} • {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-2 text-slate-600 hover:text-rose-400 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-md">
        <form onSubmit={handlePost} className="relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your announcement..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 pr-12 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none scrollbar-hide"
            rows={3}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="absolute bottom-3 right-3 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
          >
            {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Icon name="Send" size={16} />}
          </button>
        </form>
      </div>
    </div>
  );

  if (compact) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
        >
          <Icon name="Megaphone" className="mr-2 h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">Announcements</span>
          <span className="sm:hidden">Announce</span>
        </Button>

        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Content Container */}
              <motion.div
                initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
                animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
                exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                  "relative w-full overflow-hidden bg-slate-900 border-t border-white/10 shadow-2xl flex flex-col",
                  // Mobile Styles
                  "h-[85vh] rounded-t-2xl",
                  // Desktop Styles
                  "sm:h-[600px] sm:max-w-md sm:rounded-2xl sm:border sm:border-white/10"
                )}
              >
                {/* Mobile Handle */}
                <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onClick={() => setIsOpen(false)}>
                  <div className="w-12 h-1.5 rounded-full bg-slate-700" />
                </div>

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