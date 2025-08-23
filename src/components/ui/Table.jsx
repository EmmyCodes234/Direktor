import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import Icon from '../AppIcon';

const Table = ({
  data = [],
  columns = [],
  sortable = true,
  pagination = false,
  itemsPerPage = 10,
  className = "",
  emptyMessage = "No data available",
  loading = false,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  mobileResponsive = true,
  mobileCardView = true,
}) => {
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sortable || !sortBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, sortOrder, sortable]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (columnKey) => {
    if (!sortable) return;

    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (columnKey) => {
    if (!sortable || sortBy !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-muted-foreground/50" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-primary" /> : 
      <ChevronDown className="w-4 h-4 text-primary" />;
  };

  const handleRowClick = (row, index) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  const handleRowSelection = (rowId) => {
    if (!selectable || !onSelectionChange) return;

    const newSelection = selectedRows.includes(rowId)
      ? selectedRows.filter(id => id !== rowId)
      : [...selectedRows, rowId];
    
    onSelectionChange(newSelection);
  };

  // Mobile card view component
  const MobileCardView = () => (
    <div className="space-y-3">
      {paginatedData.map((row, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "mobile-card-compact cursor-pointer transition-all duration-200",
            onRowClick && "hover:bg-muted/10 active:scale-[0.98]",
            selectedRows.includes(row.id) && "ring-2 ring-primary bg-primary/5"
          )}
          onClick={() => handleRowClick(row, index)}
        >
          <div className="space-y-3">
            {columns.map((column) => {
              if (column.hideOnMobile) return null;
              
              const cellValue = row[column.key];
              const cellContent = column.render ? column.render(cellValue, row, index) : cellValue;
              
              return (
                <div key={column.key} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {column.label}
                  </span>
                  <div className="text-sm text-foreground text-right">
                    {cellContent}
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectable && (
            <div className="mt-3 pt-3 border-t border-border/10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowSelection(row.id);
                }}
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon 
                  name={selectedRows.includes(row.id) ? "CheckSquare" : "Square"} 
                  size={16} 
                  className={selectedRows.includes(row.id) ? "text-primary" : ""}
                />
                <span>{selectedRows.includes(row.id) ? "Selected" : "Select"}</span>
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  // Desktop table view component
  const DesktopTableView = () => (
    <div className="mobile-table">
      <table className="mobile-table-content">
        <thead>
          <tr className="border-b border-border/10">
            {selectable && (
              <th className="mobile-table-cell w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectionChange(paginatedData.map(row => row.id));
                    } else {
                      onSelectionChange([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-border/20 text-primary focus:ring-primary/50"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "mobile-table-cell text-left font-medium text-muted-foreground",
                  sortable && "cursor-pointer hover:text-foreground transition-colors",
                  column.className
                )}
                onClick={() => sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {paginatedData.map((row, index) => (
            <motion.tr
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "hover:bg-muted/5 transition-colors",
                onRowClick && "cursor-pointer",
                selectedRows.includes(row.id) && "bg-primary/5"
              )}
              onClick={() => handleRowClick(row, index)}
            >
              {selectable && (
                <td className="mobile-table-cell">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleRowSelection(row.id);
                    }}
                    className="h-4 w-4 rounded border-border/20 text-primary focus:ring-primary/50"
                  />
                </td>
              )}
              {columns.map((column) => {
                const cellValue = row[column.key];
                const cellContent = column.render ? column.render(cellValue, row, index) : cellValue;
                
                return (
                  <td key={column.key} className={cn("mobile-table-cell", column.className)}>
                    {cellContent}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className={cn("glass-card overflow-hidden rounded-xl", className)}>
        <div className="p-4 sm:p-6 border-b border-border/10">
          <div className="flex space-x-4">
            {columns.map((_, i) => (
              <div key={i} className="h-4 bg-muted/20 rounded w-20 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 sm:p-6">
              <div className="flex space-x-4">
                {columns.map((_, j) => (
                  <div key={j} className="h-4 bg-muted/20 rounded w-16 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("glass-card p-8 text-center", className)}>
        <Icon name="Inbox" size={48} className="mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile Card View */}
      <div className="mobile-visible">
        <MobileCardView />
      </div>

      {/* Desktop Table View */}
      <div className="mobile-hidden">
        <div className="glass-card overflow-hidden rounded-xl">
          <DesktopTableView />
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mobile-padding">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-mobile-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
            <span className="text-sm font-medium">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-mobile-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table; 