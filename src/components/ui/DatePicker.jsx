import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';
import Calendar from './Calendar';

const DatePicker = forwardRef(({
  className,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select date...",
  size = "md",
  variant = "default",
  disabled = false,
  error,
  minDate,
  maxDate,
  format = "MM/dd/yyyy",
  showClearButton = true,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || defaultValue);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setInputValue(formatDate(value));
    }
  }, [value, format]);

  useEffect(() => {
    if (defaultValue) {
      setSelectedDate(defaultValue);
      setInputValue(formatDate(defaultValue));
    }
  }, [defaultValue, format]);

  const sizeClasses = {
    sm: "h-8 px-2 text-sm",
    md: "h-10 px-3 text-base",
    lg: "h-12 px-4 text-lg",
    xl: "h-14 px-5 text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[900]} placeholder:text-${designTokens.colors.neutral[500]} focus:border-${designTokens.colors.primary[500]} focus:ring-${designTokens.colors.primary[500]}/20`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} text-${designTokens.colors.primary[900]} placeholder:text-${designTokens.colors.primary[500]} focus:border-${designTokens.colors.primary[600]} focus:ring-${designTokens.colors.primary[600]}/20`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]} text-${designTokens.colors.secondary[900]} placeholder:text-${designTokens.colors.secondary[500]} focus:border-${designTokens.colors.secondary[600]} focus:ring-${designTokens.colors.secondary[600]}/20`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]} text-${designTokens.colors.neutral[800]} placeholder:text-${designTokens.colors.neutral[400]} focus:border-${designTokens.colors.neutral[500]} focus:ring-${designTokens.colors.neutral[500]}/20`,
  };

  const errorClasses = `border-${designTokens.colors.error[500]} text-${designTokens.colors.error[900]} placeholder:text-${designTokens.colors.error[400]} focus:border-${designTokens.colors.error[600]} focus:ring-${designTokens.colors.error[600]}/20`;

  const disabledClasses = `opacity-50 cursor-not-allowed bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[500]}`;

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-7 w-7",
  };

  const formatDate = (date) => {
    if (!date) return "";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return format
      .replace('MM', month)
      .replace('dd', day)
      .replace('yyyy', year);
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Simple parsing for MM/dd/yyyy format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      const date = new Date(year, month, day);
      if (date.getMonth() === month && date.getDate() === day && date.getFullYear() === year) {
        return date;
      }
    }
    
    return null;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    const parsedDate = parseDate(value);
    if (parsedDate) {
      setSelectedDate(parsedDate);
      onValueChange?.(parsedDate);
    }
  };

  const handleInputBlur = () => {
    // Validate input on blur
    const parsedDate = parseDate(inputValue);
    if (parsedDate) {
      setInputValue(formatDate(parsedDate));
    } else {
      setInputValue(selectedDate ? formatDate(selectedDate) : "");
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setInputValue(formatDate(date));
    setIsOpen(false);
    onValueChange?.(date);
  };

  const handleClear = () => {
    setSelectedDate(null);
    setInputValue("");
    onValueChange?.(null);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      {...props}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex w-full rounded-md border bg-transparent font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed",
            sizeClasses[size],
            error ? errorClasses : variantClasses[variant],
            disabled && disabledClasses,
            "pr-10" // Space for calendar icon
          )}
        />
        
        {/* Calendar Icon */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "absolute right-0 top-0 h-full px-3 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
            `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]}`
          )}
        >
          <Icon name="Calendar" size={iconSizeClasses[size]} />
        </button>
        
        {/* Clear Button */}
        {showClearButton && selectedDate && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute right-8 top-0 h-full px-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]}`
            )}
          >
            <Icon name="X" size={iconSizeClasses[size]} />
          </button>
        )}
      </div>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 z-50 mt-1 w-auto"
          >
            <div className="rounded-lg border bg-background p-3 shadow-lg">
              <Calendar
                value={selectedDate}
                onValueChange={handleDateSelect}
                minDate={minDate}
                maxDate={maxDate}
                size={size}
                variant={variant}
                disabled={disabled}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const DatePickerTrigger = forwardRef(({
  className,
  children,
  onClick,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn("inline-flex items-center", className)}
      {...props}
    >
      {children}
    </button>
  );
});

const DatePickerContent = forwardRef(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const DatePickerInput = forwardRef(({
  className,
  value,
  onChange,
  placeholder,
  size = "md",
  variant = "default",
  disabled = false,
  error,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "h-8 px-2 text-sm",
    md: "h-10 px-3 text-base",
    lg: "h-12 px-4 text-lg",
    xl: "h-14 px-5 text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[900]} placeholder:text-${designTokens.colors.neutral[500]} focus:border-${designTokens.colors.primary[500]} focus:ring-${designTokens.colors.primary[500]}/20`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} text-${designTokens.colors.primary[900]} placeholder:text-${designTokens.colors.primary[500]} focus:border-${designTokens.colors.primary[600]} focus:ring-${designTokens.colors.primary[600]}/20`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]} text-${designTokens.colors.secondary[900]} placeholder:text-${designTokens.colors.secondary[500]} focus:border-${designTokens.colors.secondary[600]} focus:ring-${designTokens.colors.secondary[600]}/20`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]} text-${designTokens.colors.neutral[800]} placeholder:text-${designTokens.colors.neutral[400]} focus:border-${designTokens.colors.neutral[500]} focus:ring-${designTokens.colors.neutral[500]}/20`,
  };

  const errorClasses = `border-${designTokens.colors.error[500]} text-${designTokens.colors.error[900]} placeholder:text-${designTokens.colors.error[400]} focus:border-${designTokens.colors.error[600]} focus:ring-${designTokens.colors.error[600]}/20`;

  const disabledClasses = `opacity-50 cursor-not-allowed bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[500]}`;

  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "flex w-full rounded-md border bg-transparent font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed",
        sizeClasses[size],
        error ? errorClasses : variantClasses[variant],
        disabled && disabledClasses,
        className
      )}
      {...props}
    />
  );
});

const DatePickerWithLabel = forwardRef(({
  className,
  label,
  description,
  error,
  required = false,
  size = "md",
  variant = "default",
  disabled = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
    >
      {label && (
        <label className={cn(
          "block font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : size === "xl" ? "text-xl" : "text-base",
          error ? `text-${designTokens.colors.error[600]}` : `text-${designTokens.colors.neutral[700]}`
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <DatePicker
        size={size}
        variant={variant}
        disabled={disabled}
        error={error}
        {...props}
      />
      
      {description && !error && (
        <p className={cn(
          "text-sm",
          `text-${designTokens.colors.neutral[500]}`
        )}>
          {description}
        </p>
      )}
      
      {error && (
        <p className={cn(
          "text-sm",
          `text-${designTokens.colors.error[600]}`
        )}>
          {error}
        </p>
      )}
    </div>
  );
});

DatePicker.displayName = "DatePicker";
DatePickerTrigger.displayName = "DatePickerTrigger";
DatePickerContent.displayName = "DatePickerContent";
DatePickerInput.displayName = "DatePickerInput";
DatePickerWithLabel.displayName = "DatePickerWithLabel";

export {
  DatePicker,
  DatePickerTrigger,
  DatePickerContent,
  DatePickerInput,
  DatePickerWithLabel,
};
export default DatePicker;
