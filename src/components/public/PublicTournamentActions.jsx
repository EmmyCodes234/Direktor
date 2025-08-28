import React, { useState } from 'react';
import { Eye, Users, Trophy, Calendar, Share2, Download, BookOpen, Star } from 'lucide-react';
import ExpandableTabsJS from '../ui/expandable-tabs';

const PublicTournamentActions = ({ onAction, tournamentSlug }) => {
  const [selectedTab, setSelectedTab] = useState(null);

  const actionTabs = [
    { title: "Overview", icon: Eye },
    { title: "Players", icon: Users },
    { title: "Standings", icon: Trophy },
    { title: "Pairings", icon: Calendar },
    { type: "separator" },
    { title: "Share", icon: Share2 },
    { title: "Export", icon: Download },
    { title: "Rules", icon: BookOpen },
    { title: "Rate", icon: Star },
  ];

  const handleTabChange = (index) => {
    if (index !== null) {
      const action = actionTabs[index];
      if (action.title && action.title !== 'separator') {
        const actionKey = action.title.toLowerCase();
        onAction(actionKey, action.title);
        setSelectedTab(index);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Navigate and interact with the tournament</p>
        </div>
      </div>
      
      <ExpandableTabsJS 
        tabs={actionTabs}
        activeColor="text-purple-500"
        className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50"
        onChange={handleTabChange}
      />
    </div>
  );
};

export default PublicTournamentActions;
