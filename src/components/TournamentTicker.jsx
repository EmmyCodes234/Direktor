import React from 'react';
import Icon from './AppIcon';
import '../styles/ticker.css';


const TournamentTicker = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return null;
  }
  // Support both string and {type, text}
  const getIcon = (msg) => {
    if (typeof msg === 'string') return <Icon name="Zap" size={14} className="text-primary mr-3 shrink-0" />;
    if (msg.type === 'announcement') return <Icon name="Megaphone" size={14} className="text-warning mr-3 shrink-0" />;
    return <Icon name="Zap" size={14} className="text-primary mr-3 shrink-0" />;
  };
  const getText = (msg) => (typeof msg === 'string' ? msg : msg.text);
  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {messages.map((msg, i) => (
          <div className="ticker__item" key={i}>
            {getIcon(msg)}
            {getText(msg)}
          </div>
        ))}
        {/* Duplicate messages for a seamless loop */}
        {messages.map((msg, i) => (
          <div className="ticker__item" key={`dup-${i}`}>
            {getIcon(msg)}
            {getText(msg)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentTicker;