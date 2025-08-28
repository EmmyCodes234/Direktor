import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const TimePicker = forwardRef(({
  className,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select time...",
  size = "md",
  variant = "default",
  disabled = false,
  error,
  minTime,
  maxTime,
  format = "12h", // "12h" or "24h"
  step = 15, // minutes step
  showSeconds = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(value || defaultValue);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value) {
      setSelectedTime(value);
      setInputValue(formatTime(value));
    }
  }, [value, format]);

  useEffect(() => {
    if (defaultValue) {
      setSelectedTime(defaultValue);
      setInputValue(formatTime(defaultValue));
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

  const formatTime = (time) => {
    if (!time) return "";
    
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    
    if (format === "12h") {
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      if (showSeconds) {
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
      }
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } else {
      if (showSeconds) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  };

  const parseTime = (timeString) => {
    if (!timeString) return null;
    
    // Parse 12h format: "12:30 PM" or "12:30:45 PM"
    if (format === "12h") {
      const match = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = match[3] ? parseInt(match[3]) : 0;
        const period = match[4].toUpperCase();
        
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        
        const date = new Date();
        date.setHours(hours, minutes, seconds, 0);
        return date;
      }
    } else {
      // Parse 24h format: "14:30" or "14:30:45"
      const match = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = match[3] ? parseInt(match[3]) : 0;
        
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
          const date = new Date();
          date.setHours(hours, minutes, seconds, 0);
          return date;
        }
      }
    }
    
    return null;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    const parsedTime = parseTime(value);
    if (parsedTime) {
      setSelectedTime(parsedTime);
      onValueChange?.(parsedTime);
    }
  };

  const handleInputBlur = () => {
    // Validate input on blur
    const parsedTime = parseTime(inputValue);
    if (parsedTime) {
      setInputValue(formatTime(parsedTime));
    } else {
      setInputValue(selectedTime ? formatTime(selectedTime) : "");
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setInputValue(formatTime(time));
    setIsOpen(false);
    onValueChange?.(time);
  };

  const handleClear = () => {
    setSelectedTime(null);
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

  const generateTimeOptions = () => {
    const options = [];
    const startHour = 0;
    const endHour = 23;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += step) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        
        if (minTime && time < minTime) continue;
        if (maxTime && time > maxTime) continue;
        
        options.push(time);
      }
    }
    
    return options;
  };

  const timeOptions = generateTimeOptions();

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
            "pr-10" // Space for clock icon
          )}
        />
        
        {/* Clock Icon */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "absolute right-0 top-0 h-full px-3 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
            `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.neutral[700]}`
          )}
        >
          <Icon name="Clock" size={iconSizeClasses[size]} />
        </button>
        
        {/* Clear Button */}
        {selectedTime && !disabled && (
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

      {/* Time Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 z-50 mt-1 w-48 max-h-60 overflow-auto rounded-lg border bg-background shadow-lg"
          >
            <div className="p-2">
              {timeOptions.map((time, index) => {
                const isSelected = selectedTime && time.getTime() === selectedTime.getTime();
                const isDisabled = (minTime && time < minTime) || (maxTime && time > maxTime);
                
                return (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => handleTimeSelect(time)}
                    disabled={isDisabled}
                    className={cn(
                      "flex w-full items-center justify-center rounded-sm px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      isDisabled && `text-${designTokens.colors.neutral[400]}`,
                      !isDisabled && !isSelected && `text-${designTokens.colors.neutral[900]} hover:bg-${designTokens.colors.neutral[100]}`,
                      isSelected && `bg-${designTokens.colors.primary[500]} text-white hover:bg-${designTokens.colors.primary[600]}`
                    )}
                    whileHover={!isDisabled ? { scale: 1.02 } : {}}
                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  >
                    {formatTime(time)}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const TimePickerTrigger = forwardRef(({
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

const TimePickerContent = forwardRef(({
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

const TimePickerInput = forwardRef(({
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

const TimePickerWithLabel = forwardRef(({
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
      
      <TimePicker
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

TimePicker.displayName = "TimePicker";
TimePickerTrigger.displayName = "TimePickerTrigger";
TimePickerContent.displayName = "TimePickerContent";
TimePickerInput.displayName = "TimePickerInput";
TimePickerWithLabel.displayName = "TimePickerWithLabel";

export {
  TimePicker,
  TimePickerTrigger,
  TimePickerContent,
  TimePickerInput,
  TimePickerWithLabel,
};
export default TimePicker;
