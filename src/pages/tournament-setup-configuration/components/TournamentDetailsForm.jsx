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

        {/* --- Location Field (New) --- */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Venue (e.g. Hotel Name)"
            type="text"
            placeholder="Tournament venue"
            value={formData.venue}
            onChange={(e) => handleInputChange('venue', e.target.value)}
            error={errors.venue}
            required
            className="glow-focus"
          />
          <Input
            label="Location (City, Country)"
            type="text"
            placeholder="e.g. Lagos, Nigeria"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="glow-focus"
          />
        </div>

        {/* --- Date Fields --- */}
        {formData.type === 'best_of_league' ? (
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
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
          <div className="lg:col-span-2">
            <Input
              label="Tournament Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              error={errors.date}
              required
              className="glow-focus"
            />
          </div>
        )}

        {/* --- Pairing System & Public Toggle --- */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Pairing System
            </label>
            <select
              value={formData.pairing_system || 'swiss'}
              onChange={(e) => handleInputChange('pairing_system', e.target.value)}
              className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="swiss">Swiss System</option>
              <option value="round_robin">Round Robin</option>
              <option value="koth">King of the Hill</option>
              <option value="quartile">Quartile / Gibson</option>
              <option value="team_rr">Team Round Robin</option>
            </select>
          </div>

          <div className="flex items-end pb-2">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleInputChange('is_public', !formData.is_public)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  formData.is_public ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    formData.is_public ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <span className="text-sm font-medium text-foreground">
                Publicly Visible
              </span>
            </div>
          </div>
        </div>

        {/* --- Tournament Type Field --- */}
        <div className="lg:col-span-2">
          <label className="text-sm font-medium leading-none text-foreground">
            Tournament Structure
          </label>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 rounded-lg bg-input p-1">
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
            {/* <button
              type="button"
              onClick={() => handleInputChange('type', 'team')}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                formData.type === 'team' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted/50'
              )}
            >
              Team Event
            </button> */}
            {/* <button
              type="button"
              onClick={() => handleInputChange('type', 'best_of_league')}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                formData.type === 'best_of_league' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted/50'
              )}
            >
              Match Play Series
            </button> */}
            {/* <button
              type="button"
              onClick={() => handleInputChange('type', 'ladder')}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                formData.type === 'ladder' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted/50'
              )}
            >
              Ladder System
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailsForm;