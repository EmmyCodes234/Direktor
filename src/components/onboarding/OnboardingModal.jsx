import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './OnboardingProvider';
import OnboardingStep from './OnboardingStep';
import OnboardingProgress from './OnboardingProgress';
import Button from '../ui/Button';
import Icon from '../AppIcon';

const OnboardingModal = () => {
  const {
    isOnboarding,
    currentStep,
    completedSteps,
    userType,
    preferences,
    skipOnboarding,
    nextStep,
    previousStep,
    completeOnboarding
  } = useOnboarding();

  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Direktor',
      subtitle: 'Your Professional Tournament Management Platform',
      component: 'WelcomeStep',
      isRequired: true
    },
    {
      id: 'user-type',
      title: 'How will you use Direktor?',
      subtitle: 'Choose your primary role to customize your experience',
      component: 'UserTypeStep',
      isRequired: true
    },
    {
      id: 'tournament-types',
      title: 'What tournaments interest you?',
      subtitle: 'Select the types of tournaments you\'ll be managing or participating in',
      component: 'TournamentTypesStep',
      isRequired: false
    },
    {
      id: 'features',
      title: 'Key Features Overview',
      subtitle: 'Discover what makes Direktor the ultimate tournament platform',
      component: 'FeaturesStep',
      isRequired: false
    },
    {
      id: 'preferences',
      title: 'Customize Your Experience',
      subtitle: 'Set your preferences for notifications and display options',
      component: 'PreferencesStep',
      isRequired: false
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      subtitle: 'Welcome to the future of tournament management',
      component: 'CompleteStep',
      isRequired: true
    }
  ];

  const currentStepData = onboardingSteps[currentStep];
  const totalSteps = onboardingSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = async () => {
    if (currentStep === totalSteps - 1) {
      await completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
  };

  const canGoNext = () => {
    if (currentStep === 0) return true; // Welcome step
    if (currentStep === 1) return userType; // User type step
    if (currentStep === totalSteps - 1) return true; // Complete step
    return true; // Other steps are optional
  };

  if (!isOnboarding) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Icon name="Trophy" className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentStepData.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.subtitle}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/50"
                aria-label="Skip onboarding"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <OnboardingProgress 
            currentStep={currentStep}
            totalSteps={totalSteps}
            progress={progress}
            completedSteps={completedSteps}
          />

          {/* Content */}
          <div className="p-6 min-h-[400px] flex flex-col">
            <OnboardingStep 
              step={currentStepData}
              userType={userType}
              preferences={preferences}
            />
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                {currentStepData.isRequired && (
                  <span className="text-primary font-medium">Required</span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={previousStep}
                    className="hover:bg-muted"
                  >
                    <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="min-w-[120px]"
                >
                  {currentStep === totalSteps - 1 ? (
                    <>
                      <Icon name="Check" className="w-4 h-4 mr-2" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
