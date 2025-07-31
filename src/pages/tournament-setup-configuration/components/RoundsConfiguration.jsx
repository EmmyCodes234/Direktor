import React from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';

const RoundsConfiguration = ({ formData, onChange, errors }) => {
  const isBestOfLeague = formData.type === 'best_of_league';
  const requiredRounds = formData.playerCount > 1 ? formData.playerCount - 1 : 0;

  const handleGamesPerMatchChange = (value) => {
    const games = value === '' ? '' : parseInt(value, 10);
    onChange('games_per_match', games);
  };
  
  const winsNeeded = formData.games_per_match ? Math.floor(formData.games_per_match / 2) + 1 : 0;

  return (
    <div className="glass-card p-8 mb-8 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-primary">
          <Icon name="RotateCcw" size={20} color="white" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            {isBestOfLeague ? 'League Configuration' : 'Rounds Configuration'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isBestOfLeague ? 'Define the match format for your league.' : 'Set the number of tournament rounds.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isBestOfLeague ? (
            <>
                <div className="p-4 bg-muted/20 rounded-lg">
                    <p className="text-sm font-medium text-foreground">Required Rounds (Matches)</p>
                    <p className="text-2xl font-bold font-mono text-primary">{requiredRounds}</p>
                    <p className="text-xs text-muted-foreground">Based on {formData.playerCount} players for a full round-robin.</p>
                </div>
                <Input
                    label="Games per Match (Best of)"
                    type="number"
                    placeholder="e.g., 15"
                    value={formData.games_per_match || ''}
                    onChange={(e) => handleGamesPerMatchChange(e.target.value)}
                    required
                    min="1"
                    className="glow-focus"
                />
            </>
        ) : (
            <>
                <Input
                  label="Number of Rounds"
                  type="number"
                  placeholder="Enter number of rounds"
                  value={formData.rounds}
                  onChange={(e) => onChange('rounds', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  error={errors.rounds}
                  required
                  min="1"
                  max="50"
                  className="glow-focus"
                />

                <div className="flex items-center space-x-4 p-4 glass-morphism rounded-lg">
                  <Icon name="Info" size={20} className="text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Recommended: {formData.playerCount > 0 ? Math.ceil(Math.log2(formData.playerCount)) + 2 : 'N/A'} rounds
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Based on {formData.playerCount} finalized players.
                    </p>
                  </div>
                </div>
            </>
        )}
      </div>
      
      <AnimatePresence>
        {isBestOfLeague && winsNeeded > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="p-4 bg-accent/10 border border-accent/20 rounded-lg overflow-hidden"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Trophy" size={16} className="text-accent" />
              <span className="text-sm font-medium text-accent">
                Win Condition
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              The first player to win <strong className="text-foreground">{winsNeeded}</strong> games wins the match.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoundsConfiguration;