import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './OnboardingProvider';
import Icon from '../AppIcon';

const OnboardingTooltip = ({ 
  target, 
  title, 
  content, 
  position = 'bottom', 
  step,
  onNext,
  onSkip 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const tooltipRef = useRef(null);
  const { currentStep } = useOnboarding();

  useEffect(() => {
    if (currentStep === step) {
      const targetElement = typeof target === 'string' 
        ? document.querySelector(target) 
        : target;
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        setIsVisible(true);
        
        // Highlight the target element
        targetElement.style.zIndex = '1000';
        targetElement.style.position = 'relative';
        targetElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        targetElement.style.borderRadius = '8px';
        
        return () => {
          targetElement.style.zIndex = '';
          targetElement.style.position = '';
          targetElement.style.boxShadow = '';
          targetElement.style.borderRadius = '';
        };
      }
    } else {
      setIsVisible(false);
    }
  }, [currentStep, step, target]);

  const getPositionStyles = () => {
    if (!targetRect) return {};
    
    const tooltipWidth = 300;
    const tooltipHeight = 150;
    const offset = 12;
    
    switch (position) {
      case 'top':
        return {
          left: targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
          top: targetRect.top - tooltipHeight - offset,
        };
      case 'bottom':
        return {
          left: targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
          top: targetRect.bottom + offset,
        };
      case 'left':
        return {
          left: targetRect.left - tooltipWidth - offset,
          top: targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2),
        };
      case 'right':
        return {
          left: targetRect.right + offset,
          top: targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2),
        };
      default:
        return {};
    }
  };

  const handleNext = () => {
    setIsVisible(false);
    if (onNext) onNext();
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  if (!isVisible || currentStep !== step) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[9999] pointer-events-none"
        style={getPositionStyles()}
      >
        {/* Tooltip Content */}
        <div className="w-80 bg-card border border-border rounded-xl shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="Lightbulb" className="w-3 h-3 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {content}
            </p>
            
            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tour
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Next
                <Icon name="ArrowRight" className="w-3 h-3 ml-1 inline" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-card border-l border-t border-border transform rotate-45 ${
            position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' :
            position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' :
            position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' :
            'left-[-6px] top-1/2 -translate-y-1/2'
          }`}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTooltip;
