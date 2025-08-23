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
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed, user_type, onboarding_preferences')
          .eq('id', user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          setOnboardingState(prev => ({
            ...prev,
            isOnboarding: true,
            userType: profile.user_type || null,
            preferences: profile.onboarding_preferences || {}
          }));
        }
      }
    };

    checkOnboardingStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // Check onboarding status for new user
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed, user_type, onboarding_preferences')
            .eq('id', session.user.id)
            .single();

          if (!profile || !profile.onboarding_completed) {
            setOnboardingState(prev => ({
              ...prev,
              isOnboarding: true,
              userType: profile?.user_type || null,
              preferences: profile?.onboarding_preferences || {}
            }));
          }
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

        if (error) throw error;

        // Mark onboarding as complete
        setOnboardingState(prev => ({
          ...prev,
          isOnboarding: false,
          completedSteps: [...prev.completedSteps, prev.currentStep]
        }));

        return true;
      } catch (error) {
        console.error('Error completing onboarding:', error);
        return false;
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

        if (error) throw error;

        setOnboardingState(prev => ({
          ...prev,
          isOnboarding: false,
          skipOnboarding: true
        }));

        return true;
      } catch (error) {
        console.error('Error skipping onboarding:', error);
        return false;
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
