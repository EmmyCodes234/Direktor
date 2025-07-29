import React from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';

const PlayerListItem = ({ player, onEdit, onRemove, onWithdraw, isSelected, onSelect, teamName }) => {
  const statusInfo = {
    active: { icon: 'UserCheck', color: 'text-success', label: 'Active' },
    inactive: { icon: 'UserX', color: 'text-warning', label: 'Inactive' },
    removed: { icon: 'UserMinus', color: 'text-destructive', label: 'Removed' },
    withdrawn: { icon: 'UserOff', color: 'text-muted-foreground', label: 'Withdrawn' },
  }[player.status] || { icon: 'User', color: 'text-muted-foreground', label: 'Unknown' };

  return (
    <div className={`flex items-center p-4 transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/10'}`}>
      <div className="flex items-center space-x-4 flex-1">
        
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium">
            {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        )}

        <div>
          <h3 className="font-medium text-foreground">{player.name}</h3>
          {teamName && (
              <div className="flex items-center space-x-1 text-xs text-accent">
                  <Icon name="Shield" size={12} />
                  <span>{teamName}</span>
              </div>
          )}
          <div className={`flex items-center space-x-1 text-sm mt-1 ${statusInfo.color}`}>
            <Icon name={statusInfo.icon} size={14} />
            <span>{statusInfo.label}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(player)}><Icon name="Edit" size={16} /></Button>
        <Button variant="ghost" size="icon" onClick={() => onWithdraw(player)}><Icon name="UserOff" size={16} /></Button>
        <Button variant="ghost" size="icon" onClick={() => onRemove(player.id)}><Icon name="Trash2" size={16} className="text-destructive" /></Button>
      </div>
    </div>
  );
};
export default PlayerListItem;