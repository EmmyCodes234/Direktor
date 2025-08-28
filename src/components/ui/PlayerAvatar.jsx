import React, { useState } from 'react';
import Icon from '../AppIcon';

const PlayerAvatar = ({ 
  player, 
  size = 'md', 
  className = '',
  showFallback = true 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-32 h-32'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 64
  };

  // If no photo URL or image failed to load, show fallback
  if (!player?.photo_url || imageError) {
    if (!showFallback) return null;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('PlayerAvatar fallback for:', player?.name, 'photo_url:', player?.photo_url, 'imageError:', imageError);
    }
    
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium ${className}`}>
        {player?.name ? (
          player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        ) : (
          <Icon name="User" size={iconSizes[size]} />
        )}
      </div>
    );
  }

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('PlayerAvatar loading image for:', player?.name, 'photo_url:', player?.photo_url);
  }
  
  return (
    <img
      src={player.photo_url}
      alt={player.name || 'Player'}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={(e) => {
        console.warn(`Failed to load player photo for ${player.name}:`, e.target.src);
        setImageError(true);
      }}
    />
  );
};

export default PlayerAvatar;
