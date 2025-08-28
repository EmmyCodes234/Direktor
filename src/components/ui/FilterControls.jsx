import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from './Badge';
import Button from './Button';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const FilterControls = ({
  filters,
  activeFilter,
  onFilterChange,
  sortOptions,
  activeSortBy,
  onSortChange,
  onSearch,
  searchPlaceholder = "Search...",
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}
      {...props}
    >
      {/* Filter Tabs */}
      {filters && (
        <div className="flex items-center space-x-1 bg-muted/30 p-1 rounded-lg">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange?.(filter.key)}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2",
                activeFilter === filter.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <span>{filter.label}</span>
              {filter.count !== undefined && filter.count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filter.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Sort and Search Controls */}
      <div className="flex items-center space-x-2">
        {/* Sort Dropdown */}
        {sortOptions && (
          <select
            value={activeSortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="px-3 py-2 text-sm border border-border/40 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        
        {/* Search Button */}
        {onSearch && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSearch}
            className="border-border/40 hover:border-border/60"
          >
            <Icon name="Search" size={16} className="mr-2" />
            Search
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default FilterControls;