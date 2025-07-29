import React from 'react';
import Icon from '../AppIcon';
import Input from '../ui/Input';
import Button from '../ui/Button';

const PlayerSearchFilter = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange, onClearFilters, totalResults }) => {
  const statusOptions = [
    { value: 'all', label: 'All Players' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' },
    { value: 'removed', label: 'Removed Only' }
  ];
  return (
    <div className="glass-card p-4 my-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon 
              name="Search" 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              type="search"
              placeholder="Search players by name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {(searchTerm || statusFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default PlayerSearchFilter;