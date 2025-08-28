import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import Icon from './AppIcon';
import Button from './ui/Button';
import Select from './ui/Select';
import Input from './ui/Input';

const ResultSubmissionModal = ({ tournament, players, onClose }) => {
  const [formData, setFormData] = useState({
    player1_name: '',
    player2_name: '',
    score1: '',
    score2: '',
    round: tournament?.currentRound || 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!tournament) return null;

  const playerOptions = players.map(p => ({ value: p.name, label: p.name }));

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.player1_name || !formData.player2_name || !formData.score1 || !formData.score2 || !formData.round) {
      toast.error("All fields are required.");
      return;
    }
    if (formData.player1_name === formData.player2_name) {
      toast.error("Players cannot be the same.");
      return;
    }
    setIsSubmitting(true);

    const submission = {
      tournament_id: tournament.id,
      round: parseInt(formData.round, 10),
      player1_name: formData.player1_name,
      player2_name: formData.player2_name,
      score1: parseInt(formData.score1, 10),
      score2: parseInt(formData.score2, 10),
      submitted_by_name: formData.player1_name,
    };

    const { error } = await supabase.from('pending_results').insert([submission]);

    if (error) {
      toast.error("Failed to submit result. Please try again.");
      console.error("Submission Error:", error);
    } else {
      toast.success("Result submitted successfully for director approval.");
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
            <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 sm:pt-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md mx-4 animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-heading font-semibold text-foreground">Submit Game Result</h2>
          <p className="text-sm text-muted-foreground">This result will be sent for director approval.</p>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
                <Input
                    label="Round Number"
                    name="round"
                    type="number"
                    value={formData.round}
                    onChange={(e) => handleChange('round', e.target.value)}
                    placeholder="Enter the round number"
                    required
                />
                <Select
                    label="Your Name"
                    options={playerOptions}
                    value={formData.player1_name}
                    onChange={(value) => handleChange('player1_name', value)}
                    placeholder="Select your name"
                />
                <Input
                    label="Your Score"
                    name="score1"
                    type="number"
                    value={formData.score1}
                    onChange={(e) => handleChange('score1', e.target.value)}
                    placeholder="Enter your score"
                />
                <Select
                    label="Opponent's Name"
                    options={playerOptions}
                    value={formData.player2_name}
                    onChange={(value) => handleChange('player2_name', value)}
                    placeholder="Select opponent's name"
                />
                 <Input
                    label="Opponent's Score"
                    name="score2"
                    type="number"
                    value={formData.score2}
                    onChange={(e) => handleChange('score2', e.target.value)}
                    placeholder="Enter opponent's score"
                />
            </div>
            <div className="p-6 border-t border-border flex justify-end items-center space-x-2">
                <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={isSubmitting}>Submit for Approval</Button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ResultSubmissionModal;