import React from 'react';
import Icon from '../AppIcon';

const PlayerStatsSummary = ({ stats }) => {
  const summaryCards = [
    {
      title: 'Total Registered',
      value: stats.total,
      icon: 'Users',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Active Players',
      value: stats.active,
      icon: 'UserCheck',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Inactive',
      value: stats.inactive,
      icon: 'UserX',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Removed',
      value: stats.removed,
      icon: 'UserMinus',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryCards.map((card, index) => (
        <div
          key={index}
          className="glass-card p-4 hover:shadow-glow transition-all duration-200 ease-out"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                {card.title}
              </p>
              <p className="text-2xl font-heading font-semibold text-foreground mt-1">
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <Icon name={card.icon} size={20} className={card.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerStatsSummary;