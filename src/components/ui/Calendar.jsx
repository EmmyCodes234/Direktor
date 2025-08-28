import React, { forwardRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const Calendar = forwardRef(({
  className,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  variant = "default",
  disabled = false,
  minDate,
  maxDate,
  ...props
}, ref) => {
  const [currentDate, setCurrentDate] = useState(defaultValue || value || new Date());
  const [selectedDate, setSelectedDate] = useState(value || defaultValue);

  useEffect(() => {
    if (value) {
      setCurrentDate(value);
      setSelectedDate(value);
    }
  }, [value]);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]}`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]}`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]}`,
  };

  const headerSizeClasses = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
    xl: "p-5",
  };

  const cellSizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-14 w-14 text-lg",
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const calendarDays = useMemo(() => {
    return getDaysInMonth(currentDate);
  }, [currentDate]);

  const isDateDisabled = (date) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDateToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date) => {
    if (disabled || isDateDisabled(date)) return;
    
    setSelectedDate(date);
    onValueChange?.(date);
  };

  const goToPreviousMonth = () => {
    if (disabled) return;
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    if (disabled) return;
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    if (disabled) return;
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    onValueChange?.(today);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-background",
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Calendar Header */}
      <div className={cn(
        "flex items-center justify-between border-b bg-muted/50",
        headerSizeClasses[size]
      )}>
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={disabled}
          className={cn(
            "rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
            `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[900]}`
          )}
        >
          <Icon name="ChevronLeft" size={size === "sm" ? 16 : size === "lg" ? 20 : size === "xl" ? 24 : 18} />
        </button>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            disabled={disabled}
            className={cn(
              "rounded-sm px-2 py-1 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
              `text-${designTokens.colors.primary[600]} hover:bg-${designTokens.colors.primary[100]}`
            )}
          >
            Today
          </button>
          
          <h2 className={cn(
            "font-semibold",
            size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : size === "xl" ? "text-xl" : "text-base"
          )}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
        
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={disabled}
          className={cn(
            "rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
            `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[900]}`
          )}
        >
          <Icon name="ChevronRight" size={size === "sm" ? 16 : size === "lg" ? 20 : size === "xl" ? 24 : 18} />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7">
        {weekDays.map((day) => (
          <div
            key={day}
            className={cn(
              "flex h-10 items-center justify-center text-xs font-medium",
              `text-${designTokens.colors.neutral[500]}`
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-muted">
        {calendarDays.map((date, index) => {
          const isDisabled = isDateDisabled(date);
          const isSelected = isDateSelected(date);
          const isToday = isDateToday(date);
          
          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isDisabled || disabled}
              className={cn(
                "relative flex items-center justify-center rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                cellSizeClasses[size],
                isDisabled && `text-${designTokens.colors.neutral[400]}`,
                !isDisabled && !isSelected && `text-${designTokens.colors.neutral[900]} hover:bg-${designTokens.colors.neutral[100]}`,
                isToday && !isSelected && `font-bold text-${designTokens.colors.primary[600]}`,
                isSelected && `bg-${designTokens.colors.primary[500]} text-white hover:bg-${designTokens.colors.primary[600]}`,
                !isSelected && isToday && `ring-2 ring-${designTokens.colors.primary[200]}`
              )}
              whileHover={!isDisabled ? { scale: 1.05 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
            >
              {date ? date.getDate() : ""}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

const CalendarHeader = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between border-b bg-muted/50 p-3", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const CalendarTitle = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <h2
      ref={ref}
      className={cn("font-semibold", className)}
      {...props}
    >
      {children}
    </h2>
  );
});

const CalendarGrid = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("grid grid-cols-7 gap-px bg-muted", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const CalendarCell = forwardRef(({
  className,
  children,
  isSelected = false,
  isToday = false,
  isDisabled = false,
  onClick,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "relative flex items-center justify-center rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isDisabled && `text-${designTokens.colors.neutral[400]}`,
        !isDisabled && !isSelected && `text-${designTokens.colors.neutral[900]} hover:bg-${designTokens.colors.neutral[100]}`,
        isToday && !isSelected && `font-bold text-${designTokens.colors.primary[600]}`,
        isSelected && `bg-${designTokens.colors.primary[500]} text-white hover:bg-${designTokens.colors.primary[600]}`,
        !isSelected && isToday && `ring-2 ring-${designTokens.colors.primary[200]}`,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

const CalendarNavigation = forwardRef(({
  className,
  onPrevious,
  onNext,
  onToday,
  disabled = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <button
        type="button"
        onClick={onPrevious}
        disabled={disabled}
        className={cn(
          "rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
          `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[900]}`
        )}
      >
        <Icon name="ChevronLeft" size={18} />
      </button>
      
      {onToday && (
        <button
          type="button"
          onClick={onToday}
          disabled={disabled}
          className={cn(
            "rounded-sm px-2 py-1 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
            `text-${designTokens.colors.primary[600]} hover:bg-${designTokens.colors.primary[100]}`
          )}
        >
          Today
        </button>
      )}
      
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className={cn(
          "rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
          `text-${designTokens.colors.neutral[600]} hover:text-${designTokens.colors.neutral[900]}`
        )}
      >
        <Icon name="ChevronRight" size={18} />
      </button>
    </div>
  );
});

Calendar.displayName = "Calendar";
CalendarHeader.displayName = "CalendarHeader";
CalendarTitle.displayName = "CalendarTitle";
CalendarGrid.displayName = "CalendarGrid";
CalendarCell.displayName = "CalendarCell";
CalendarNavigation.displayName = "CalendarNavigation";

export {
  Calendar,
  CalendarHeader,
  CalendarTitle,
  CalendarGrid,
  CalendarCell,
  CalendarNavigation,
};
export default Calendar;
