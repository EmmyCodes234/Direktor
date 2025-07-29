import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReconciliationRow = ({ imp, matches, onChange }) => {
  const [action, setAction] = useState('create');
  const [linkedPlayerId, setLinkedPlayerId] = useState(null);

  useEffect(() => {
    let initialAction = 'create';
    let initialPlayerId = null;
    let initialPlayer = null;

    if (matches && matches.length === 1) {
      const match = matches[0];
      if (Math.abs(match.rating - imp.rating) < 50) {
        initialAction = 'link';
        initialPlayerId = match.id;
        initialPlayer = match;
      }
    }
    setAction(initialAction);
    setLinkedPlayerId(initialPlayerId);
    onChange(imp, initialAction, initialPlayer);
  }, [imp, matches, onChange]);

  const handleActionChange = (e) => {
    const value = e.target.value;
    if (value === 'create') {
        setAction('create');
        setLinkedPlayerId(null);
        onChange(imp, 'create', null);
    } else {
        const selectedPlayer = matches.find(p => p.id.toString() === value);
        setAction('link');
        setLinkedPlayerId(value);
        onChange(imp, 'link', selectedPlayer);
    }
  };

  const needsReview = matches && matches.length > 1 && action === 'create';

  return (
    <div className={`grid grid-cols-3 gap-4 items-center p-4 border-b border-border transition-colors ${needsReview ? 'bg-warning/10' : ''}`}>
      {/* Column 1: Imported Player */}
      <div>
        <p className="font-semibold">{imp.name}</p>
        <p className="text-sm text-muted-foreground">Rating: {imp.rating || 'N/A'}</p>
      </div>

      {/* Column 2: Potential Matches */}
      <div>
        {matches && matches.length > 0 ? (
          matches.map(match => (
            <div key={match.id} className="text-sm p-2 rounded-md bg-muted/20 mb-2 flex items-center space-x-3">
              <img 
                src={match.photo_url || `https://ui-avatars.com/api/?name=${match.name.split(' ').join('+')}&background=0d89ec&color=fff`} 
                alt={match.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-foreground">{match.name}</p>
                <p className="text-xs text-muted-foreground">
                  Rating: {match.rating} | Location: {match.location || 'N/A'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-success flex items-center">
            <Icon name="Sparkles" size={14} className="mr-2"/> New player
          </p>
        )}
      </div>

      {/* Column 3: Action */}
      <div className="flex items-center space-x-2">
        <select 
            value={action === 'link' ? linkedPlayerId : 'create'}
            onChange={handleActionChange}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm w-full"
        >
            <option value="create">➕ Create New Player</option>
            {matches && matches.map(match => (
                <option key={match.id} value={match.id}>🔗 Link to {match.name} ({match.rating})</option>
            ))}
        </select>
      </div>
    </div>
  );
};

const PlayerReconciliationModal = ({ imports, matches, onCancel, onFinalize }) => {
  const [reconciledData, setReconciledData] = useState(new Map());

  const handleRowChange = useCallback((imp, action, linkedPlayer) => {
    setReconciledData(prev => new Map(prev.set(imp.name, { ...imp, action, linkedPlayer })));
  }, []);

  const handleFinalizeClick = () => {
    onFinalize(Array.from(reconciledData.values()));
  };
  
  const summary = useMemo(() => {
    const actions = Array.from(reconciledData.values());
    return {
      create: actions.filter(a => a.action === 'create').length,
      link: actions.filter(a => a.action === 'link').length,
      total: actions.length
    }
  }, [reconciledData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        className="glass-card w-full max-w-4xl h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-heading font-semibold">Review & Reconcile Players</h2>
          <p className="text-muted-foreground text-sm">Match imported players with the Master Library or create new ones.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/10 border-b border-border text-sm font-semibold text-muted-foreground">
            <h3>New Import</h3>
            <h3>Potential Matches in Library</h3>
            <h3>Action to Take</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {imports.map((imp, index) => (
            <ReconciliationRow 
              key={`${imp.name}-${index}`}
              imp={imp} 
              matches={matches.get(imp.name)}
              onChange={handleRowChange}
            />
          ))}
        </div>
        <div className="p-4 border-t border-border flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-success">{summary.link}</span> players linked, <span className="font-semibold text-accent">{summary.create}</span> new players will be created.
            </div>
            <div className="flex space-x-2">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleFinalizeClick}>Finalize {summary.total} Players</Button>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlayerReconciliationModal;