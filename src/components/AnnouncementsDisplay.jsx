import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from './AppIcon';
import { motion, AnimatePresence } from 'framer-motion';

const AnnouncementsDisplay = () => {
  const { tournamentSlug } = useParams();
  const [announcements, setAnnouncements] = useState([]);
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
        console.error('[AnnouncementsDisplay] Fetch Error:', tError);
        return;
      }

      const id = tournamentData.id;
      setTournamentId(id);

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('tournament_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[AnnouncementsDisplay] Fetch Error:', error);
      } else {
        setAnnouncements(data);
      }
    };

    fetchTournamentAndAnnouncements();

    const channel = supabase
      .channel(`public-announcements-${tournamentSlug}`)
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

  if (!announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <AnimatePresence>
        {announcements.map((ann, index) => (
          <motion.div
            key={ann.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 mb-3 border-l-4 border-primary"
          >
            <div className="flex items-start space-x-3">
              <Icon name="Megaphone" className="text-primary mt-1" size={20} />
              <div>
                <p className="text-foreground">{ann.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Posted {new Date(ann.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsDisplay;