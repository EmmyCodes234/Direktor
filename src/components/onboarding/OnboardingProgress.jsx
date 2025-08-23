import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';

const OnboardingProgress = ({ currentStep, totalSteps, progress, completedSteps }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className="px-6 py-4 bg-muted/20 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">
          Setup Progress
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}% Complete
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      {/* Step Indicators */}
      <div className="flex items-center justify-between mt-4">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isFuture = step > currentStep;
          
          return (
            <div key={step} className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCompleted ? (
                  <Icon name="Check" className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{step + 1}</span>
                )}
              </motion.div>
              
              {/* Step Label */}
              <span className={`text-xs mt-1 text-center ${
                isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {step === 0 && 'Welcome'}
                {step === 1 && 'Role'}
                {step === 2 && 'Tournaments'}
                {step === 3 && 'Features'}
                {step === 4 && 'Settings'}
                {step === 5 && 'Complete'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingProgress;
