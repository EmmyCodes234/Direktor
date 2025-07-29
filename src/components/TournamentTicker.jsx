import React from 'react';
import Icon from './AppIcon';
import '../styles/ticker.css';

const TournamentTicker = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return null; // Don't render if there are no messages
  }

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {messages.map((msg, i) => (
          <div className="ticker__item" key={i}>
            <Icon name="Zap" size={14} className="text-primary mr-3 shrink-0" />
            {msg}
          </div>
        ))}
        {/* Duplicate messages for a seamless loop */}
        {messages.map((msg, i) => (
          <div className="ticker__item" key={`dup-${i}`}>
            <Icon name="Zap" size={14} className="text-primary mr-3 shrink-0" />
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentTicker;