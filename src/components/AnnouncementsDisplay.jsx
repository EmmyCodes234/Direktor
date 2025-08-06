import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from './AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

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

  const getAnnouncementStyle = (message) => {
    if (message.includes('Clash of the Titans')) {
        return {
            icon: 'Swords',
            borderColor: 'border-amber-500',
            iconColor: 'text-amber-500'
        };
    }
    if (message.includes('Upset Alert')) {
        return {
            icon: 'Rocket',
            borderColor: 'border-emerald-500',
            iconColor: 'text-emerald-500'
        };
    }
    return {
        icon: 'Megaphone',
        borderColor: 'border-primary',
        iconColor: 'text-primary'
    };
  };

  return (
    <div className="mb-8">
      <AnimatePresence>
        {announcements.map((ann, index) => {
          const style = getAnnouncementStyle(ann.message);
          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn("glass-card p-4 mb-3 border-l-4", style.borderColor)}
            >
              <div className="flex items-start space-x-3">
                <Icon name={style.icon} className={cn("mt-1", style.iconColor)} size={20} />
                <div>
                  <p className="text-foreground">{ann.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Posted {new Date(ann.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsDisplay;