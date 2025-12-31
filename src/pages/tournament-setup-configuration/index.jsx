import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TournamentDetailsForm from './components/TournamentDetailsForm';
import RoundsConfiguration from './components/RoundsConfiguration';
import PlayerRosterManager from './components/PlayerRosterManager';
import TeamManager from './components/TeamManager';
import DivisionManager from './components/DivisionManager';
import SetupProgress from './components/SetupProgress';
import PlayerReconciliationModal from './components/PlayerReconciliationModal';
import Icon from '../../components/AppIcon';
import { Toaster, toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import Button from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
}

const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const TournamentSetupConfiguration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useQuery();

  const [currentStep, setCurrentStep] = useState('details');
  const [isLoading, setIsLoading] = useState(false);

  // Simplified State - No Player/Team Management in Wizard anymore
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    location: '', // New
    date: '',
    type: 'individual',
    rounds: 8,
    start_date: '',
    end_date: '',
    games_per_match: 0,
    pairing_system: 'swiss', // New
    is_public: true, // New
    // Legacy fields kept structure but unused in Wizard
    playerCount: 0,
    player_ids: [],
    teams: [],
    divisions: [],
  });

  useEffect(() => {
    const planName = query.get('name');
    const planRounds = query.get('rounds');
    const planVenue = query.get('venue');
    const planDate = query.get('date');
    const planStartDate = query.get('start_date');
    const planEndDate = query.get('end_date');
    const planType = query.get('type');

    // Validate date format before setting
    const validateDate = (dateStr) => {
      if (!dateStr) return '';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return dateStr;
        }
      }
      return '';
    };

    setFormData(prev => ({
      ...prev,
      name: planName || prev.name,
      rounds: planRounds ? parseInt(planRounds, 10) : prev.rounds,
      venue: planVenue || prev.venue,
      date: validateDate(planDate) || prev.date,
      start_date: validateDate(planStartDate) || prev.start_date,
      end_date: validateDate(planEndDate) || prev.end_date,
      type: planType || prev.type,
    }));
  }, [location.search]);


  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Simplification: Re-enable Divisions
  const handleNextStep = () => {
    if (currentStep === 'details') {
      setCurrentStep('divisions');
    } else if (currentStep === 'divisions') {
      setCurrentStep('rounds');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'rounds') {
      setCurrentStep('divisions');
    } else if (currentStep === 'divisions') {
      setCurrentStep('details');
    }
  };

  const generateUniqueSlug = async (name) => {
    const baseSlug = createSlug(name);
    let slug = baseSlug;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      const { data, error } = await supabase
        .from('tournaments')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        isUnique = true;
      }
    }
    return slug;
  };

  const handleCreateTournament = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to create a tournament.");

      const uniqueSlug = await generateUniqueSlug(formData.name);

      const rounds = formData.type === 'best_of_league' ? 0 : formData.rounds;

      const sanitizeDate = (val) => {
        if (typeof val !== 'string' || val.trim() === '') return null;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(val)) return null;
        return val;
      };

      if (formData.type === 'best_of_league') {
        const startDate = sanitizeDate(formData.start_date);
        const endDate = sanitizeDate(formData.end_date);
        if (startDate && endDate) {
          if (new Date(endDate) < new Date(startDate)) {
            throw new Error('End date cannot be before start date.');
          }
        }
      }

      const tournamentData = {
        name: formData.name,
        venue: formData.venue,
        location: formData.location,
        date: sanitizeDate(formData.date),
        start_date: sanitizeDate(formData.start_date),
        end_date: sanitizeDate(formData.end_date),
        rounds: rounds,
        status: 'setup',
        playerCount: 0,
        type: formData.type,
        divisions: formData.divisions, // Save Divisions Configuration
        games_per_match: formData.games_per_match,
        slug: uniqueSlug,
        user_id: user.id,
        pairing_system: formData.pairing_system,
        is_public: formData.is_public
      };

      const { data: newTournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert(tournamentData)
        .select('id, slug')
        .single();

      if (tournamentError) throw tournamentError;

      toast.success('Tournament created successfully!');
      setTimeout(() => navigate(`/tournament/${newTournament.slug}/dashboard`), 500);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to create tournament: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stepsConfig = [
    { id: 'details', label: 'Details' },
    { id: 'divisions', label: 'Divisions' },
    { id: 'rounds', label: 'Configuration' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />
      <Header />
      <main className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-gradient mb-4">
              New Tournament
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="md:col-span-1">
              <SetupProgress steps={stepsConfig} currentStep={currentStep} onStepClick={setCurrentStep} />
            </div>
            <div className="md:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 'details' && <TournamentDetailsForm formData={formData} onChange={handleFormChange} errors={{}} />}
                  {currentStep === 'divisions' && <DivisionManager formData={formData} onDivisionsChange={(divs) => handleFormChange('divisions', divs)} />}
                  {currentStep === 'rounds' && <RoundsConfiguration formData={formData} onChange={handleFormChange} errors={{}} />}
                </motion.div>
              </AnimatePresence>
              <div className="mt-8 flex justify-between items-center">
                {currentStep !== 'details' ? (<Button variant="outline" onClick={handlePrevStep}>Back</Button>) : <div />}
                {currentStep !== 'rounds' ? (<Button onClick={handleNextStep}>Next</Button>) : (<Button onClick={handleCreateTournament} loading={isLoading}>Create Tournament</Button>)}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TournamentSetupConfiguration;