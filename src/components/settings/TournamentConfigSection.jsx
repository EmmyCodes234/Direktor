import React, { useRef, useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Input from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { cn } from '../../utils/cn';

const countries = [
    { name: 'Australia', currency: 'AUD' },
    { name: 'Botswana', currency: 'P' },
    { name: 'Canada', currency: 'CAD' },
    { name: 'England', currency: '£' },
    { name: 'France', currency: '€' },
    { name: 'Gambia', currency: 'D' },
    { name: 'Gabon', currency: 'FCFA' },
    { name: 'Germany', currency: '€' },
    { name: 'Ghana', currency: 'GH₵' },
    { name: 'Hong Kong', currency: 'HK$' },
    { name: 'India', currency: '₹' },
    { name: 'Indonesia', currency: 'Rp' },
    { name: 'Ireland', currency: '€' },
    { name: 'Israel', currency: '₪' },
    { name: 'Kenya', currency: 'KSh' },
    { name: 'Malaysia', currency: 'RM' },
    { name: 'Malta', currency: '€' },
    { name: 'Nepal', currency: '₨' },
    { name: 'Netherlands', currency: '€' },
    { name: 'Nigeria', currency: '₦' },
    { name: 'Northern Ireland', currency: '£' },
    { name: 'Pakistan', currency: '₨' },
    { name: 'Philippines', currency: '₱' },
    { name: 'Qatar', currency: 'ر.ق' },
    { name: 'Romania', currency: 'lei' },
    { name: 'Scotland', currency: '£' },
    { name: 'Sierra Leone', currency: 'Le' },
    { name: 'Singapore', currency: 'S$' },
    { name: 'South Africa', currency: 'R' },
    { name: 'Spain', currency: '€' },
    { name: 'Sweden', currency: 'kr' },
    { name: 'Switzerland', currency: 'CHF' },
    { name: 'Thailand', currency: '฿' },
    { name: 'Togo', currency: 'CFA' },
    { name: 'Uganda', currency: 'USh' },
    { name: 'United Arab Emirates', currency: 'د.إ' },
    { name: 'United States', currency: '$' },
    { name: 'Wales', currency: '£' },
    { name: 'Zambia', currency: 'ZK' },
];

const CountrySelector = ({ value, onChange, onOpenChange }) => {
    const countryOptions = countries.map(c => ({ label: `${c.name} (${c.currency})`, value: c.currency }));
    return (
        <Select
            label="Currency (Country)"
            options={countryOptions}
            value={value}
            onChange={onChange}
            onOpenChange={onOpenChange}
            placeholder="Select a country..."
        />
    );
};

const TournamentConfigSection = ({ settings, onSettingsChange, onBannerFileChange }) => {
  const bannerInputRef = useRef(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);

  useEffect(() => {
    setBannerPreview(settings.banner_url);
  }, [settings.banner_url]);

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onBannerFileChange(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
          <Icon name="Image" size={20} className="text-primary" />
          <span>Tournament Banner</span>
        </h3>
        <div className="w-full aspect-[4/1] bg-muted/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-border">
            {bannerPreview ? (
                <img src={bannerPreview} alt="Tournament Banner" className="w-full h-full object-cover"/>
            ) : (
                <p className="text-muted-foreground text-sm">No banner uploaded</p>
            )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          For best results, use a wide, panoramic image (e.g., 1200 x 300 pixels).
        </p>
        <input 
          type="file" 
          ref={bannerInputRef} 
          onChange={handleBannerChange} 
          accept="image/png, image/jpeg, image/gif" 
          className="hidden" 
        />
        <Button variant="outline" onClick={() => bannerInputRef.current.click()}>
            <Icon name="UploadCloud" size={16} className="mr-2"/>
            {settings.banner_url ? 'Change Banner' : 'Upload Banner'}
        </Button>
      </div>

      <div className={cn("glass-card p-6", isCountrySelectorOpen && "relative z-10")}>
        <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
          <Icon name="Info" size={20} className="text-primary" />
          <span>Basic Information</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tournament Name"
            type="text"
            value={settings.name || ''}
            onChange={(e) => onSettingsChange('name', e.target.value)}
          />
          <Input
            label="Venue"
            type="text"
            value={settings.venue || ''}
            onChange={(e) => onSettingsChange('venue', e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={settings.date || ''}
            onChange={(e) => onSettingsChange('date', e.target.value)}
          />
           <Input
            label="Total Rounds"
            type="number"
            value={settings.rounds || 0}
            onChange={(e) => onSettingsChange('rounds', parseInt(e.target.value, 10))}
          />
          <CountrySelector
            value={settings.currency || '$'}
            onChange={(value) => onSettingsChange('currency', value)}
            onOpenChange={setIsCountrySelectorOpen}
          />
        </div>
      </div>
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
          <Icon name="Shield" size={20} className="text-primary" />
          <span>Permissions</span>
        </h3>
        <Checkbox
          label="Enable Remote Score Submission"
          checked={settings.is_remote_submission_enabled || false}
          onCheckedChange={(checked) => onSettingsChange('is_remote_submission_enabled', checked)}
          description="Allow players to submit scores from the public page for director approval."
        />
      </div>
    </div>
  );
};
export default TournamentConfigSection;