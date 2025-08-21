import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { toast } from 'sonner';

const ResultsTerminal = ({ players, onResultSubmit }) => {
  const [selectedPlayer1, setSelectedPlayer1] = useState('');
  const [selectedPlayer2, setSelectedPlayer2] = useState('');
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const playerOptions = players.map(p => ({ value: p.name, label: p.name }));

  const handleQuickSubmit = () => {
    if (!selectedPlayer1 || !selectedPlayer2 || !score1 || !score2) {
      toast.error('Please select both players and enter their scores');
      return;
    }
    if (selectedPlayer1 === selectedPlayer2) {
      toast.error('Players cannot be the same');
      return;
    }

    const result = {
      player1: selectedPlayer1,
      player2: selectedPlayer2,
      score1: parseInt(score1),
      score2: parseInt(score2)
    };

    setIsProcessing(true);
    // onResultSubmit is an async function from the parent
    onResultSubmit(result).finally(() => {
        setSelectedPlayer1('');
        setSelectedPlayer2('');
        setScore1('');
        setScore2('');
        setIsProcessing(false);
    });
  };

  return (
    <div className="glass-card">
      <div className="p-4 lg:p-6 border-b border-border/10">
        <h3 className="font-heading font-semibold text-foreground flex items-center space-x-2">
            <Icon name="ClipboardEdit" size={18} className="text-primary" />
            <span>Quick Score Entry</span>
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Player 1</label>
            <Select
              value={selectedPlayer1}
              onChange={(value) => setSelectedPlayer1(value)}
              options={playerOptions}
              placeholder="Select player..."
            />
            <Input
              type="number"
              placeholder="Score"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
            />
          </div>

          <span className="text-muted-foreground font-semibold mb-5 hidden sm:block">VS</span>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Player 2</label>
            <Select
              value={selectedPlayer2}
              onChange={(value) => setSelectedPlayer2(value)}
              options={playerOptions}
              placeholder="Select player..."
            />
            <Input
              type="number"
              placeholder="Score"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleQuickSubmit}
          disabled={isProcessing || !selectedPlayer1 || !selectedPlayer2 || !score1 || !score2}
          loading={isProcessing}
          className="w-full"
        >
          Record Result
        </Button>
      </div>
    </div>
  );
};

export default ResultsTerminal;