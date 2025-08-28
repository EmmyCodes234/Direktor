import React, { forwardRef, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { designTokens } from '../../design-system';
import Icon from '../AppIcon';

const FileUpload = forwardRef(({
  className,
  value,
  onChange,
  onRemove,
  multiple = false,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  size = "md",
  variant = "default",
  disabled = false,
  error,
  dragAndDrop = true,
  showPreview = true,
  maxFiles = 5,
  ...props
}, ref) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState(value || []);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const sizeClasses = {
    sm: "p-3 text-sm",
    md: "p-4 text-base",
    lg: "p-6 text-lg",
    xl: "p-8 text-xl",
  };

  const variantClasses = {
    default: `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[900]}`,
    primary: `bg-${designTokens.colors.primary[50]} border-${designTokens.colors.primary[200]} text-${designTokens.colors.primary[900]}`,
    secondary: `bg-${designTokens.colors.secondary[50]} border-${designTokens.colors.secondary[200]} text-${designTokens.colors.secondary[900]}`,
    muted: `bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[300]} text-${designTokens.colors.neutral[800]}`,
  };

  const errorClasses = `border-${designTokens.colors.error[500]} text-${designTokens.colors.error[900]} bg-${designTokens.colors.error[50]}`;

  const disabledClasses = `opacity-50 cursor-not-allowed bg-${designTokens.colors.neutral[100]} border-${designTokens.colors.neutral[200]} text-${designTokens.colors.neutral[500]}`;

  const dragOverClasses = `border-${designTokens.colors.primary[500]} bg-${designTokens.colors.primary[50]}`;

  const iconSizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
  };

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${formatFileSize(maxSize)}` };
    }

    // Check file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileName = file.name;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          // Extension-based validation
          return fileName.toLowerCase().endsWith(type.toLowerCase());
        } else if (type.includes('*')) {
          // MIME type pattern matching
          const pattern = type.replace('*', '.*');
          return new RegExp(pattern).test(fileType);
        } else {
          // Exact MIME type matching
          return fileType === type;
        }
      });

      if (!isAccepted) {
        return { valid: false, error: `File type not allowed. Accepted: ${accept}` };
      }
    }

    return { valid: true };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback((selectedFiles) => {
    if (disabled) return;

    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      // You could show these errors in a toast or alert
    }

    if (validFiles.length > 0) {
      let newFiles;
      if (multiple) {
        newFiles = [...files, ...validFiles].slice(0, maxFiles);
      } else {
        newFiles = [validFiles[0]];
      }
      
      setFiles(newFiles);
      onChange?.(multiple ? newFiles : newFiles[0]);
    }
  }, [files, multiple, maxFiles, maxSize, accept, disabled, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onRemove?.(files[index], index);
    onChange?.(multiple ? newFiles : newFiles[0] || null);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const renderFilePreview = (file, index) => {
    if (!showPreview) return null;

    const isImage = file.type.startsWith('image/');
    const fileIcon = isImage ? 'Image' : 'File';

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "relative flex items-center gap-3 rounded-lg border p-3",
          `bg-${designTokens.colors.neutral[50]} border-${designTokens.colors.neutral[200]}`
        )}
      >
        {isImage ? (
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded",
            `bg-${designTokens.colors.neutral[200]}`
          )}>
            <Icon name={fileIcon} size={24} className={`text-${designTokens.colors.neutral[600]}`} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-sm">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        
        <button
          type="button"
          onClick={() => handleRemoveFile(index)}
          className={cn(
            "rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            `text-${designTokens.colors.neutral[500]} hover:text-${designTokens.colors.error[600]}`
          )}
        >
          <Icon name="X" size={16} />
        </button>
      </motion.div>
    );
  };

  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      {...props}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200",
          sizeClasses[size],
          error ? errorClasses : variantClasses[variant],
          disabled && disabledClasses,
          isDragOver && !disabled && dragOverClasses,
          "hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Icon
            name={isDragOver ? "Upload" : "UploadCloud"}
            size={iconSizeClasses[size] === "h-8 w-8" ? 32 : iconSizeClasses[size] === "h-12 w-12" ? 48 : iconSizeClasses[size] === "h-16 w-16" ? 64 : 80}
            className={cn(
              "mb-4",
              isDragOver ? `text-${designTokens.colors.primary[600]}` : `text-${designTokens.colors.neutral[400]}`
            )}
          />
          
          <div className="space-y-2">
            <p className={cn(
              "font-medium",
              size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : size === "xl" ? "text-xl" : "text-base"
            )}>
              {isDragOver ? "Drop files here" : "Click to upload or drag and drop"}
            </p>
            
            <p className={cn(
              "text-muted-foreground",
              size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : size === "xl" ? "text-base" : "text-sm"
            )}>
              {multiple ? `Up to ${maxFiles} files` : "Single file"} • Max size: {formatFileSize(maxSize)}
              {accept && ` • Accepted: ${accept}`}
            </p>
          </div>
        </div>
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <AnimatePresence>
            {files.map((file, index) => renderFilePreview(file, index))}
          </AnimatePresence>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className={cn(
          "mt-2 text-sm",
          `text-${designTokens.colors.error[600]}`
        )}>
          {error}
        </p>
      )}
    </div>
  );
});

const FileUploadTrigger = forwardRef(({
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

const FileUploadContent = forwardRef(({
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

const FileUploadWithLabel = forwardRef(({
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
      
      <FileUpload
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
    </div>
  );
});

FileUpload.displayName = "FileUpload";
FileUploadTrigger.displayName = "FileUploadTrigger";
FileUploadContent.displayName = "FileUploadContent";
FileUploadWithLabel.displayName = "FileUploadWithLabel";

export {
  FileUpload,
  FileUploadTrigger,
  FileUploadContent,
  FileUploadWithLabel,
};
export default FileUpload;
