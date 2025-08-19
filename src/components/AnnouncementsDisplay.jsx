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
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold flex items-center">
          <Icon name="Megaphone" className="mr-2 text-primary" size={20} />
          Tournament Announcements
        </h2>
        <span className="text-sm text-muted-foreground">
          {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence>
          {announcements.map((ann, index) => {
            const style = getAnnouncementStyle(ann.message);
            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={cn(
                  "glass-card p-5 border-l-4 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-pointer",
                  style.borderColor
                )}
              >
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                    style.iconColor === 'text-primary' && "bg-primary/10",
                    style.iconColor === 'text-amber-500' && "bg-amber-500/10",
                    style.iconColor === 'text-emerald-500' && "bg-emerald-500/10"
                  )}>
                    <Icon name={style.icon} className={cn("", style.iconColor)} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-relaxed font-medium text-base">
                      {ann.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3 font-mono">
                      Posted {new Date(ann.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default AnnouncementsDisplay;