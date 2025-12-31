import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from './OnboardingProvider';
import Button from '../ui/Button';
import Icon from '../AppIcon';

const OnboardingStep = ({ step, userType, preferences }) => {
  const { updatePreferences } = useOnboarding();

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'user-type':
        return <UserTypeStep userType={userType} />;
      case 'tournament-types':
        return <TournamentTypesStep preferences={preferences} />;
      case 'features':
        return <FeaturesStep />;
      case 'preferences':
        return <PreferencesStep preferences={preferences} />;
      case 'complete':
        return <CompleteStep userType={userType} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col"
    >
      {renderStepContent()}
    </motion.div>
  );
};

// Welcome Step
const WelcomeStep = () => {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto"
      >
        <Icon name="Trophy" className="w-12 h-12 text-primary-foreground" />
      </motion.div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-foreground">
          Welcome to Direktor! 🏆
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          You're about to discover the most powerful and intuitive tournament management platform ever created.
          Let's get you set up in just a few minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="text-center p-4 rounded-lg bg-muted/30">
          <Icon name="Zap" className="w-8 h-8 text-primary mx-auto mb-2" />
          <h4 className="font-semibold text-foreground">Lightning Fast</h4>
          <p className="text-sm text-muted-foreground">Set up tournaments in minutes</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-muted/30">
          <Icon name="Shield" className="w-8 h-8 text-primary mx-auto mb-2" />
          <h4 className="font-semibold text-foreground">Professional</h4>
          <p className="text-sm text-muted-foreground">NASPA-compliant standards</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-muted/30">
          <Icon name="Globe" className="w-8 h-8 text-primary mx-auto mb-2" />
          <h4 className="font-semibold text-foreground">Anywhere Access</h4>
          <p className="text-sm text-muted-foreground">Works on all devices</p>
        </div>
      </div>
    </div>
  );
};

// User Type Step
const UserTypeStep = ({ userType }) => {
  const { updatePreferences } = useOnboarding();

  const userTypes = [
    {
      id: 'director',
      title: 'Tournament Director',
      description: 'I organize and manage Scrabble tournaments',
      icon: 'Crown',
      features: ['Create tournaments', 'Manage pairings', 'Track results', 'Generate reports']
    },
    {
      id: 'player',
      title: 'Competitive Player',
      description: 'I participate in tournaments and track my performance',
      icon: 'User',
      features: ['View pairings', 'Submit results', 'Track standings', 'View statistics']
    },
    {
      id: 'spectator',
      title: 'Tournament Spectator',
      description: 'I follow tournaments and view live results',
      icon: 'Eye',
      features: ['Live standings', 'Pairing updates', 'Player profiles', 'Tournament history']
    }
  ];

  const handleUserTypeSelect = (type) => {
    updatePreferences({ userType: type });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          How will you use Direktor?
        </h3>
        <p className="text-muted-foreground">
          Choose your primary role to customize your experience
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {userTypes.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => handleUserTypeSelect(type.id)}
            className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${userType === type.id
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${userType === type.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                <Icon name={type.icon} className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">{type.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                <ul className="space-y-1">
                  {type.features.map((feature, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Icon name="Check" className="w-3 h-3 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {userType === type.id && (
                <Icon name="CheckCircle" className="w-6 h-6 text-primary" />
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Tournament Types Step
const TournamentTypesStep = ({ preferences }) => {
  const { updatePreferences } = useOnboarding();

  const tournamentTypes = [
    { id: 'individual', label: 'Individual Tournaments', icon: 'User' },
    // { id: 'team', label: 'Team Tournaments', icon: 'Users' },
    // { id: 'club', label: 'Club Events', icon: 'Home' },
    // { id: 'national', label: 'National Championships', icon: 'Flag' },
    // { id: 'online', label: 'Online Tournaments', icon: 'Globe' },
    // { id: 'youth', label: 'Youth Events', icon: 'Heart' }
  ];

  const handleToggle = (type) => {
    const currentTypes = preferences.tournamentTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];

    updatePreferences({ tournamentTypes: newTypes });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          What tournaments interest you?
        </h3>
        <p className="text-muted-foreground">
          Select all that apply (optional)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tournamentTypes.map((type) => {
          const isSelected = (preferences.tournamentTypes || []).includes(type.id);
          return (
            <motion.button
              key={type.id}
              onClick={() => handleToggle(type.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  <Icon name={type.icon} className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{type.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Features Step
const FeaturesStep = () => {
  const features = [
    {
      icon: 'Zap',
      title: 'Smart Pairing',
      description: 'Advanced algorithms for fair and competitive matchups'
    },
    {
      icon: 'BarChart3',
      title: 'Real-time Analytics',
      description: 'Live standings, statistics, and performance tracking'
    },
    {
      icon: 'Trophy',
      title: 'Prize Management',
      description: 'Automated prize distribution with tie-breaker handling'
    },
    {
      icon: 'Wifi',
      title: 'Offline Mode',
      description: 'Continue working even without internet connection'
    },
    {
      icon: 'Share2',
      title: 'Live Sharing',
      description: 'Public tournament pages for spectators and players'
    },
    {
      icon: 'Shield',
      title: 'Professional Standards',
      description: 'NASPA-compliant rules and tournament protocols'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Discover Direktor's Power
        </h3>
        <p className="text-muted-foreground">
          See what makes Direktor the ultimate tournament platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg bg-muted/30 border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon name={feature.icon} className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Preferences Step
const PreferencesStep = ({ preferences }) => {
  const { updatePreferences } = useOnboarding();

  const handleToggle = (key) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  const preferenceOptions = [
    {
      key: 'emailNotifications',
      title: 'Email Notifications',
      description: 'Receive updates about your tournaments via email',
      icon: 'Mail'
    },
    {
      key: 'pushNotifications',
      title: 'Push Notifications',
      description: 'Get real-time alerts on your device',
      icon: 'Bell'
    },
    {
      key: 'darkMode',
      title: 'Dark Mode',
      description: 'Use dark theme for better visibility',
      icon: 'Moon'
    },
    {
      key: 'compactView',
      title: 'Compact View',
      description: 'Show more information in less space',
      icon: 'Minimize2'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Customize Your Experience
        </h3>
        <p className="text-muted-foreground">
          Set your preferences (you can change these later)
        </p>
      </div>

      <div className="space-y-4">
        {preferenceOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name={option.icon} className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{option.title}</h4>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(option.key)}
              className={`w-12 h-6 rounded-full transition-colors ${preferences[option.key] ? 'bg-primary' : 'bg-muted'
                }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${preferences[option.key] ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Complete Step
const CompleteStep = ({ userType }) => {
  const userTypeLabels = {
    director: 'Tournament Director',
    player: 'Competitive Player',
    spectator: 'Tournament Spectator'
  };

  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto"
      >
        <Icon name="Check" className="w-12 h-12 text-white" />
      </motion.div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-foreground">
          You're All Set! 🎉
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Welcome to Direktor, {userTypeLabels[userType] || 'User'}! Your account is ready and you can start exploring the platform.
        </p>
      </div>

      <div className="bg-muted/30 rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-foreground">What's Next?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-center gap-3">
            <Icon name="Rocket" className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Explore the dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Icon name="BookOpen" className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Read the documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <Icon name="Users" className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Join the community</span>
          </div>
          <div className="flex items-center gap-3">
            <Icon name="Settings" className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Customize your profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep;
