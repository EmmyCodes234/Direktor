import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

const TeamManager = ({ formData, onTeamUpdate }) => {
  const [teams, setTeams] = useState(formData.teams || []);
  const [newTeamName, setNewTeamName] = useState('');

  // Memoize player lists for performance
  const { unassignedPlayers, allPlayers } = useMemo(() => {
    const assignedPlayerIds = new Set(teams.flatMap(team => team.players.map(p => p.id)));
    const unassigned = formData.player_ids.filter(p => !assignedPlayerIds.has(p.id));
    return { unassignedPlayers: unassigned, allPlayers: formData.player_ids };
  }, [teams, formData.player_ids]);

  const handleAddTeam = (e) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      const newTeam = {
        id: `temp-team-${Date.now()}`, // Temporary ID for the UI
        name: newTeamName.trim(),
        players: [],
      };
      const updatedTeams = [...teams, newTeam];
      setTeams(updatedTeams);
      onTeamUpdate(updatedTeams); // Update parent state
      setNewTeamName('');
    }
  };

  const handleDeleteTeam = (teamId) => {
    const updatedTeams = teams.filter(t => t.id !== teamId);
    setTeams(updatedTeams);
    onTeamUpdate(updatedTeams);
  };

  const handleAssignPlayer = (teamId, playerId) => {
    const playerToAssign = allPlayers.find(p => p.id === playerId);
    if (!playerToAssign) return;

    // Create a new teams array for immutable update
    let newTeams = teams.map(team => ({
      ...team,
      players: team.players.filter(p => p.id !== playerId)
    }));

    const targetTeam = newTeams.find(t => t.id === teamId);
    if (targetTeam) {
      targetTeam.players.push(playerToAssign);
    }
    
    setTeams(newTeams);
    onTeamUpdate(newTeams);
  };
  
  const handleUnassignPlayer = (playerId) => {
      const updatedTeams = teams.map(team => ({
          ...team,
          players: team.players.filter(p => p.id !== playerId)
      }));
      setTeams(updatedTeams);
      onTeamUpdate(updatedTeams);
  }

  return (
    <div className="glass-card p-8 mb-8 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
          <Icon name="Shield" size={20} color="white" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Team Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Create teams and assign your finalized players.
          </p>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Unassigned Players */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Unassigned Players ({unassignedPlayers.length})</h3>
          <div className="space-y-2 p-3 bg-input rounded-lg h-96 overflow-y-auto">
            {unassignedPlayers.length > 0 ? (
              unassignedPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between text-sm bg-muted/20 p-2 rounded-md">
                  <span className="font-medium">{player.name}</span>
                  <select 
                    onChange={(e) => handleAssignPlayer(e.target.value, player.id)}
                    value=""
                    className="bg-transparent text-primary text-xs font-semibold focus:outline-none"
                    disabled={teams.length === 0}
                  >
                    <option value="" disabled>Assign to...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <Icon name="CheckCircle" className="mr-2"/> All players have been assigned.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Teams */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Teams ({teams.length})</h3>
          <div className="space-y-4 h-96 overflow-y-auto pr-2">
            <AnimatePresence>
              {teams.map(team => (
                <motion.div
                  key={team.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-4 bg-muted/20 border border-border rounded-lg"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-foreground">{team.name} ({team.players.length} players)</h4>
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleDeleteTeam(team.id)}>
                      <Icon name="X" size={14} className="text-muted-foreground hover:text-destructive"/>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {team.players.map(player => (
                      <div key={player.id} className="flex items-center justify-between text-sm bg-input p-2 rounded">
                        <span>{player.name}</span>
                        <Button variant="ghost" size="xs" onClick={() => handleUnassignPlayer(player.id)}>Remove</Button>
                      </div>
                    ))}
                    {team.players.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">No players assigned.</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
           <form onSubmit={handleAddTeam} className="flex space-x-2 mt-4">
              <Input
                type="text"
                placeholder="New team name..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" disabled={!newTeamName.trim()}>
                Create Team
              </Button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default TeamManager;