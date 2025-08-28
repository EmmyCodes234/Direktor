import React, { useState } from 'react';
import { Filter, Calendar, Users, Trophy, Clock, Star, Search, Grid, List, Play } from 'lucide-react';
import ExpandableTabsJS from '../ui/expandable-tabs';

const TournamentFilters = ({ onFilterChange, onViewChange, currentView = 'grid' }) => {
  const [selectedTab, setSelectedTab] = useState(null);

  const filterTabs = [
    { title: "All", icon: Grid },
    { title: "Draft", icon: Clock },
    { title: "Active", icon: Play },
    { title: "Completed", icon: Trophy },
    { type: "separator" },
    { title: "Recent", icon: Calendar },
    { title: "Popular", icon: Star },
    { title: "Large", icon: Users },
  ];

  const viewTabs = [
    { title: "Grid", icon: Grid },
    { title: "List", icon: List },
  ];

  const handleFilterChange = (index) => {
    if (index !== null) {
      const filter = filterTabs[index];
      if (filter.title && filter.title !== 'separator') {
        const filterKey = filter.title.toLowerCase();
        onFilterChange(filterKey);
        setSelectedTab(index);
      }
    }
  };

  const handleViewChange = (index) => {
    if (index !== null) {
      const view = viewTabs[index];
      if (view.title) {
        const viewKey = view.title.toLowerCase();
        onViewChange(viewKey);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tournament Filters</h2>
          <p className="text-sm text-muted-foreground">Filter and organize your tournaments</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <ExpandableTabsJS 
            tabs={viewTabs}
            activeColor="text-purple-500"
            className="border-purple-800"
            onChange={handleViewChange}
          />
        </div>
      </div>
      
      {/* Filter Tabs */}
      <ExpandableTabsJS 
        tabs={filterTabs}
        activeColor="text-purple-500"
        className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50"
        onChange={handleFilterChange}
      />
    </div>
  );
};

export default TournamentFilters;
