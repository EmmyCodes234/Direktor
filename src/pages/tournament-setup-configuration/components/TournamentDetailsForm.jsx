import React from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

const TournamentDetailsForm = ({ formData, onChange, errors }) => {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="glass-card p-8 mb-8 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
          <Icon name="Trophy" size={20} color="white" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Tournament Details
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure basic tournament information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <Input
            label="Tournament Name"
            type="text"
            placeholder="Enter tournament name (e.g., Winter Championship 2025)"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
            className="glow-focus"
          />
        </div>

        <Input
          label="Venue"
          type="text"
          placeholder="Tournament location"
          value={formData.venue}
          onChange={(e) => handleInputChange('venue', e.target.value)}
          error={errors.venue}
          required
          className="glow-focus"
        />

        {formData.type === 'best_of_league' ? (
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Start Date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                    className="glow-focus"
                />
                <Input
                    label="End Date"
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    required
                    className="glow-focus"
                />
            </div>
        ) : (
            <Input
              label="Tournament Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              error={errors.date}
              required
              className="glow-focus"
            />
        )}


        {/* --- New Tournament Type Field --- */}
        <div className="lg:col-span-2">
            <label className="text-sm font-medium leading-none text-foreground">
                Tournament Type
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-input p-1">
                <button
                    type="button"
                    onClick={() => handleInputChange('type', 'individual')}
                    className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        formData.type === 'individual' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted/50'
                    )}
                >
                    Individual
                </button>
                <button
                    type="button"
                    onClick={() => handleInputChange('type', 'team')}
                    className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        formData.type === 'team' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted/50'
                    )}
                >
                    Team Event
                </button>
                <button
                    type="button"
                    onClick={() => handleInputChange('type', 'best_of_league')}
                    className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        formData.type === 'best_of_league' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted/50'
                    )}
                >
                    "Best of" League
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailsForm;