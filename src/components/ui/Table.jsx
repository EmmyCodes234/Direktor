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

  if (loading) {
    return (
      <div className={cn("glass-card overflow-hidden rounded-xl", className)}>
        <div className="p-4 lg:p-6 border-b border-border/10">
          <div className="flex space-x-4">
            {columns.map((_, i) => (
              <div key={i} className="h-4 bg-muted/20 rounded w-20 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 lg:p-6">
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
      <div className={cn("glass-card p-12 text-center", className)}>
        <Icon name="Database" size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop Table */}
      <div className="hidden md:block glass-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted/20">
              <tr>
                {selectable && (
                  <th className="p-4 lg:p-6 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-border/40"
                      checked={selectedRows.length === data.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectionChange?.(data.map(row => row.id || row.key));
                        } else {
                          onSelectionChange?.([]);
                        }
                      }}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "p-4 lg:p-6 text-left font-semibold text-sm",
                      sortable && "cursor-pointer hover:bg-muted/30 transition-colors"
                    )}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-2">
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
                  key={row.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "hover:bg-muted/10 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => handleRowClick(row, index)}
                >
                  {selectable && (
                    <td className="p-4 lg:p-6">
                      <input
                        type="checkbox"
                        className="rounded border-border/10"
                        checked={selectedRows.includes(row.id || row.key)}
                        onChange={() => handleRowSelection(row.id || row.key)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="p-4 lg:p-6">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      {mobileResponsive && (
        <div className="md:hidden space-y-3">
          {paginatedData.map((row, index) => (
            <motion.div
              key={row.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "glass-card p-4 space-y-2",
                onRowClick && "cursor-pointer hover:bg-muted/10 transition-colors"
              )}
              onClick={() => handleRowClick(row, index)}
            >
              {selectable && (
                <div className="flex justify-end">
                  <input
                    type="checkbox"
                    className="rounded border-border/40"
                    checked={selectedRows.includes(row.id || row.key)}
                    onChange={() => handleRowSelection(row.id || row.key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {column.label}:
                  </span>
                  <span className="text-sm">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </span>
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-border/40 rounded hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-border/40 rounded hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table; 