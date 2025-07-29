import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PlayerManagement = ({ players, onRemovePlayer, onAddPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRemoveDialog, setShowRemoveDialog] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveClick = (player) => {
    setShowRemoveDialog(player);
  };

  const confirmRemove = () => {
    if (showRemoveDialog) {
      onRemovePlayer(showRemoveDialog.id);
      setShowRemoveDialog(null);
    }
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
      setShowAddForm(false);
    }
  };

  const getPlayerStatus = (player) => {
    if (player.lastGame) {
      const timeDiff = Date.now() - new Date(player.lastGame).getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      
      if (minutesAgo < 30) {
        return { status: 'active', label: 'Playing', color: 'text-warning' };
      } else if (minutesAgo < 60) {
        return { status: 'recent', label: 'Recent', color: 'text-success' };
      }
    }
    return { status: 'waiting', label: 'Waiting', color: 'text-muted-foreground' };
  };

  return (
    <div className="backdrop-blur-lg bg-card/80 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent/20">
            <Icon name="Users" size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Player Management</h3>
            <p className="text-xs text-muted-foreground">{players.length} registered players</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          iconName="Plus"
          iconSize={14}
          className="touch-target hover:shadow-glow hover:border-primary/50"
        >
          Add Player
        </Button>
      </div>

      {showAddForm && (
        <div className="p-4 sm:p-6 border-b border-border backdrop-blur-lg bg-surface/20">
          <div className="flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex-1">
              <Input
                label="Player Name"
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                className="touch-target"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleAddPlayer}
                disabled={!newPlayerName.trim()}
                className="touch-target shadow-glow"
              >
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPlayerName('');
                }}
                className="touch-target"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-border">
        <Input
          type="search"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full touch-target"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground p-4">
            <Icon name="Users" size={32} className="mb-2 opacity-50" />
            <p className="text-sm text-center">
              {searchTerm ? 'No players found' : 'No players registered'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredPlayers.map((player) => {
              const playerStatus = getPlayerStatus(player);
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:backdrop-blur-lg hover:bg-surface/20 hover:shadow-glow hover:border-primary/30 transition-smooth group touch-target"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-mono text-sm font-medium">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{player.name}</div>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <span className="font-mono">{player.wins}W-{player.losses}L</span>
                        <span className={`font-mono ${
                          player.spread > 0 ? 'text-success' : 
                          player.spread < 0 ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {player.spread > 0 ? '+' : ''}{player.spread}
                        </span>
                        <span className={playerStatus.color}>
                          {playerStatus.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleRemoveClick(player)}
                      iconName="Trash2"
                      iconSize={14}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      {showRemoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="backdrop-blur-lg bg-card/90 border border-border rounded-lg w-full max-w-md mx-4 p-6 shadow-glow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/20">
                <Icon name="AlertTriangle" size={20} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Remove Player</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to remove <strong className="text-foreground">{showRemoveDialog.name}</strong> from the tournament? 
              All their game results will be preserved but they will no longer appear in the active roster.
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowRemoveDialog(null)}
                className="touch-target"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRemove}
                iconName="Trash2"
                iconSize={16}
                className="touch-target shadow-glow"
              >
                Remove Player
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 border-t border-border backdrop-blur-lg bg-surface/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 text-xs text-muted-foreground">
          <span>Total: {players.length} players</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span>Playing</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Recent</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span>Waiting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerManagement;