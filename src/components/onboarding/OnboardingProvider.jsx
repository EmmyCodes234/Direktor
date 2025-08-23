import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const [onboardingState, setOnboardingState] = useState({
    isOnboarding: false,
    currentStep: 0,
    completedSteps: [],
    userType: null, // 'director', 'player', 'spectator'
    preferences: {},
    skipOnboarding: false
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in and if they need onboarding
    const checkOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        
        // Check if user has completed onboarding
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('onboarding_completed, user_type, onboarding_preferences')
            .eq('id', user.id)
            .single();

          // If table doesn't exist or other error, skip onboarding for now
          if (error) {
            console.warn('user_profiles table not available:', error.message);
            return;
          }

          if (profile && !profile.onboarding_completed) {
            setOnboardingState(prev => ({
              ...prev,
              isOnboarding: true,
              userType: profile.user_type || null,
              preferences: profile.onboarding_preferences || {}
            }));
          }
        } catch (error) {
          console.warn('Error checking onboarding status:', error.message);
        }
      }
    };

    checkOnboardingStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
                 if (event === 'SIGNED_IN' && session?.user) {
           console.log('User signed in, setting user state');
           setUser(session.user);
           
           // Temporarily disable onboarding checks to fix authentication
           console.log('Skipping onboarding check for now');
           
         } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setOnboardingState(prev => ({
            ...prev,
            isOnboarding: false,
            currentStep: 0,
            completedSteps: [],
            userType: null,
            preferences: {},
            skipOnboarding: false
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const startOnboarding = (userType = null) => {
    setOnboardingState(prev => ({
      ...prev,
      isOnboarding: true,
      currentStep: 0,
      completedSteps: [],
      userType,
      preferences: {},
      skipOnboarding: false
    }));
  };

  const nextStep = () => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
      completedSteps: [...prev.completedSteps, prev.currentStep]
    }));
  };

  const previousStep = () => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1)
    }));
  };

  const goToStep = (step) => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: step
    }));
  };

  const updatePreferences = (preferences) => {
    setOnboardingState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    }));
  };

  const completeOnboarding = async () => {
    if (user) {
      try {
        // Update user profile with onboarding completion
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            onboarding_completed: true,
            user_type: onboardingState.userType,
            onboarding_preferences: onboardingState.preferences,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.warn('user_profiles table not available:', error.message);
          // Still mark onboarding as complete locally even if DB update fails
          setOnboardingState(prev => ({
            ...prev,
            isOnboarding: false,
            completedSteps: [...prev.completedSteps, prev.currentStep]
          }));
          return true;
        }

        // Mark onboarding as complete
        setOnboardingState(prev => ({
          ...prev,
          isOnboarding: false,
          completedSteps: [...prev.completedSteps, prev.currentStep]
        }));

        return true;
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Still mark onboarding as complete locally even if DB update fails
        setOnboardingState(prev => ({
          ...prev,
          isOnboarding: false,
          completedSteps: [...prev.completedSteps, prev.currentStep]
        }));
        return true;
      }
    }
    return false;
  };

  const skipOnboarding = async () => {
    if (user) {
      try {
        // Mark onboarding as skipped
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            onboarding_completed: true,
            onboarding_skipped: true,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.warn('user_profiles table not available:', error.message);
          // Still mark onboarding as skipped locally even if DB update fails
          setOnboardingState(prev => ({
            ...prev,
            isOnboarding: false,
            skipOnboarding: true
          }));
          return true;
        }

        setOnboardingState(prev => ({
          ...prev,
          isOnboarding: false,
          skipOnboarding: true
        }));

        return true;
      } catch (error) {
        console.error('Error skipping onboarding:', error);
        // Still mark onboarding as skipped locally even if DB update fails
        setOnboardingState(prev => ({
          ...prev,
          isOnboarding: false,
          skipOnboarding: true
        }));
        return true;
      }
    }
    return false;
  };

  const resetOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      isOnboarding: true,
      currentStep: 0,
      completedSteps: [],
      preferences: {},
      skipOnboarding: false
    }));
  };

  const value = {
    ...onboardingState,
    user,
    startOnboarding,
    nextStep,
    previousStep,
    goToStep,
    updatePreferences,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
