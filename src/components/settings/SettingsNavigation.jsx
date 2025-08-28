import React, { useState } from 'react';
import { Home, Users, Settings, Trophy, Image, History, Shield, FileText, BarChart3, Upload } from 'lucide-react';
import ExpandableTabsJS from '../ui/expandable-tabs';

const SettingsNavigation = ({ onSectionChange, activeSection = 'overview' }) => {
  const [selectedTab, setSelectedTab] = useState(null);

  const settingsTabs = [
    { title: "Overview", icon: Home },
    { title: "Tournament", icon: Trophy },
    { title: "Players", icon: Users },
    { title: "Scoring", icon: BarChart3 },
    { type: "separator" },
    { title: "Ladder", icon: Shield },
    { title: "Carryover", icon: FileText },
    { title: "Photos", icon: Image },
    { title: "History", icon: History },
    { title: "System", icon: Settings },
  ];

  const handleTabChange = (index) => {
    if (index !== null) {
      const section = settingsTabs[index];
      if (section.title && section.title !== 'separator') {
        const sectionKey = section.title.toLowerCase();
        onSectionChange(sectionKey);
        setSelectedTab(index);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quick Navigation</h2>
          <p className="text-sm text-muted-foreground">Jump to any settings section</p>
        </div>
      </div>
      
      <ExpandableTabsJS 
        tabs={settingsTabs}
        activeColor="text-hero-primary"
        className="border-hero-purple/30 bg-hero-bg-gradient"
        onChange={handleTabChange}
      />
    </div>
  );
};

export default SettingsNavigation;
