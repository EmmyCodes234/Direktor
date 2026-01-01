import React, { useState } from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import Input from '../ui/Input';

const AddPlayer = ({ onAddPlayer }) => {
  const [playerName, setPlayerName] = useState('');
  const [rating, setRating] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onAddPlayer(playerName.trim(), rating ? parseInt(rating) : null);
      setPlayerName('');
      setRating('');
    }
  };

  return (
    <div className="glass-card p-6 mb-6">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center">
        <Icon name="UserPlus" size={20} className="mr-2 text-primary" />
        Add New Player
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Player Name"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player's full name"
          />
          <Input
            label="Initial Rating (Optional)"
            type="number"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="1200"
          />
        </div>
        <Button
          type="submit"
          disabled={!playerName.trim()}
          iconName="PlusCircle"
          iconPosition="left"
          className="w-full"
        >
          Add to Roster
        </Button>
      </form>
    </div>
  );
};

export default AddPlayer;