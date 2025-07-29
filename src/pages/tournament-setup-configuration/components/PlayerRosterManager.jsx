import React, { useState, useRef } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const PlayerRosterManager = ({ formData, onStartReconciliation }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [localPlayerNames, setLocalPlayerNames] = useState(formData.playerNames || '');

  const parsePlayerLines = (lines) => {
    return lines.map(line => {
      const parts = line.split(',');
      const name = parts[0]?.trim();
      const rating = parseInt(parts[1]?.trim(), 10) || 0;
      if (!name) return null;
      return { name, rating };
    }).filter(Boolean);
  };

  const handleProcessPlayers = () => {
    const lines = localPlayerNames.split('\n').filter(Boolean);
    const parsedPlayers = parsePlayerLines(lines);
    if (parsedPlayers.length > 0) {
      onStartReconciliation(parsedPlayers);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      setLocalPlayerNames(csv);
    };
    reader.readAsText(file);
  };
  
  const addSamplePlayers = () => {
    const samplePlayers = `Alice Johnson, 1500
Bob Smith, 1250
Carol Davis, 1800
David Wilson, 0
Emma Brown, 1620
Frank Miller, 1400
Grace Taylor, 1330
Henry Anderson, 1950
Ivy Thompson, 1100
Jack Martinez, 1770`;
    setLocalPlayerNames(samplePlayers);
  };
  
  const playerCount = (localPlayerNames || '').split('\n').filter(Boolean).length;

  return (
    <div className="glass-card p-8 mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-success to-accent">
                <Icon name="Users" size={20} color="white" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  Player Roster
                </h2>
                <p className="text-sm text-muted-foreground">
                  Import players to begin reconciliation.
                </p>
              </div>
            </div>
            {formData.playerCount > 0 ? (
                 <div className="flex items-center space-x-2 px-3 py-1 bg-success/20 border border-success/30 rounded-full">
                   <Icon name="CheckCircle" size={14} className="text-success" />
                   <span className="text-sm font-medium text-success">
                     {formData.playerCount} players finalized
                   </span>
                 </div>
            ) : (
                playerCount > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-accent/20 border border-accent/30 rounded-full">
                    <Icon name="Loader" size={14} className="text-accent animate-spin" />
                    <span className="text-sm font-medium text-accent">
                      {playerCount} players ready to import
                    </span>
                  </div>
                )
            )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                    Paste Player List
                </label>
                <textarea
                    value={localPlayerNames}
                    onChange={(e) => setLocalPlayerNames(e.target.value)}
                    placeholder={`Enter one player per line in "Name, Rating" format:\n\nAlice Johnson, 1500\nBob Smith, 1250...`}
                    className="w-full h-64 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">Format: Name, Rating (0 for unrated)</p>
                    <Button variant="ghost" size="sm" onClick={addSamplePlayers}>Add Sample</Button>
                </div>
            </div>
            <div 
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 flex flex-col items-center justify-center space-y-3
              ${dragActive ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50 hover:bg-muted/20'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
                <label className="block text-sm font-medium text-foreground mb-3">
                    Or Upload CSV
                </label>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/20">
                    <Icon name="UploadCloud" size={24} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Drag & drop CSV file here</p>
                <span className="text-xs text-muted-foreground">or</span>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Browse File</Button>
            </div>
        </div>
        <div className="mt-6 border-t border-border pt-6">
            <Button onClick={handleProcessPlayers} disabled={playerCount === 0 || formData.playerCount > 0} className="w-full" size="lg">
                <Icon name="CheckSquare" className="mr-2" />
                {formData.playerCount > 0 ? 'Roster is Finalized' : `Review & Reconcile ${playerCount > 0 ? playerCount : ''} Players`}
            </Button>
        </div>
    </div>
  );
};
export default PlayerRosterManager;