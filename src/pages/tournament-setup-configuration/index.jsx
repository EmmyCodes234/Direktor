import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TournamentDetailsForm from './components/TournamentDetailsForm';
import RoundsConfiguration from './components/RoundsConfiguration';
import PlayerRosterManager from './components/PlayerRosterManager';
import TeamManager from './components/TeamManager';
import DivisionManager from './components/DivisionManager'; // Import the new component
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

const TournamentSetupConfiguration = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const draftId = query.get('draftId');

  const [currentStep, setCurrentStep] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationData, setReconciliationData] = useState({ imports: [], matches: new Map() });
  
  const [formData, setFormData] = useState({
    name: '', venue: '', date: '', type: 'individual', rounds: 8, playerCount: 0, player_ids: [], teams: [], divisions: []
  });

  const [playerDetails, setPlayerDetails] = useState([]);

  useEffect(() => {
    // Placeholder for draft functionality
  }, [draftId]);
  
  useEffect(() => {
    const fetchPlayerDetails = async () => {
        if(formData.player_ids.length === 0) return;
        
        const { data, error } = await supabase
            .from('players')
            .select('id, name')
            .in('id', formData.player_ids);
        
        if (error) {
            toast.error("Failed to fetch player details for team management.");
        } else {
            setPlayerDetails(data);
        }
    };
    fetchPlayerDetails();
  }, [formData.player_ids]);


  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDivisionsChange = (divisions) => {
    setFormData(prev => ({ ...prev, divisions }));
  };

  const handleTeamUpdate = (teams) => {
      setFormData(prev => ({ ...prev, teams }));
  }

  const handleNextStep = () => {
    if (currentStep === 'details') {
        setCurrentStep('players');
    } else if (currentStep === 'players') {
        setCurrentStep('divisions');
    } else if (currentStep === 'divisions') {
        if (formData.type === 'team') {
            setCurrentStep('teams');
        } else {
            setCurrentStep('rounds');
        }
    } else if (currentStep === 'teams') {
        setCurrentStep('rounds');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'rounds') {
        if (formData.type === 'team') {
            setCurrentStep('teams');
        } else {
            setCurrentStep('divisions');
        }
    } else if (currentStep === 'teams') {
        setCurrentStep('divisions');
    } else if (currentStep === 'divisions') {
        setCurrentStep('players');
    } else if (currentStep === 'players') {
        setCurrentStep('details');
    }
  };

  const startReconciliation = async (parsedPlayers) => {
    setIsLoading(true);
    toast.info("Checking for existing players in the Master Library...");
    const namesToSearch = parsedPlayers.map(p => p.name);
    
    const { data: existingPlayers, error } = await supabase
      .from('players')
      .select('*')
      .in('name', namesToSearch);

    if (error) {
      toast.error("Could not check Master Player Library.");
      setIsLoading(false);
      return;
    }

    const matches = new Map();
    existingPlayers.forEach(p => {
      if (!matches.has(p.name)) matches.set(p.name, []);
      matches.get(p.name).push(p);
    });

    setReconciliationData({ imports: parsedPlayers, matches });
    setIsReconciling(true);
    setIsLoading(false);
  };

  const finalizeRoster = async (reconciledPlayers) => {
    setIsLoading(true);
    toast.info("Finalizing roster...");

    const newPlayersToCreate = reconciledPlayers.filter(p => p.action === 'create');
    const playersToLink = reconciledPlayers.filter(p => p.action === 'link');

    let finalPlayerIds = playersToLink.map(p => p.linkedPlayer.id);

    if (newPlayersToCreate.length > 0) {
      const newPlayerRecords = newPlayersToCreate.map(p => ({
        name: p.name,
        rating: p.rating,
      }));

      const { data: createdPlayers, error } = await supabase
        .from('players')
        .insert(newPlayerRecords)
        .select('id');

      if (error) {
        toast.error(`Failed to create new players: ${error.message}`);
        setIsLoading(false);
        return;
      }
      finalPlayerIds = [...finalPlayerIds, ...createdPlayers.map(p => p.id)];
    }

    setFormData(prev => ({ ...prev, player_ids: finalPlayerIds, playerCount: finalPlayerIds.length }));
    setIsReconciling(false);
    setIsLoading(false);
    toast.success("Roster finalized successfully!");
  };

  const handleCreateTournament = async () => {
    setIsLoading(true);
    try {
        const tournamentData = {
            name: formData.name,
            venue: formData.venue,
            date: formData.date,
            rounds: formData.rounds,
            status: 'setup',
            playerCount: formData.playerCount,
            type: formData.type,
            divisions: formData.divisions,
        };
        
        const { data: newTournament, error: tournamentError } = await supabase
            .from('tournaments')
            .insert(tournamentData)
            .select('id')
            .single();

        if (tournamentError) throw tournamentError;

        const { data: fetchedPlayerDetails, error: playerError } = await supabase
            .from('players')
            .select('id, rating')
            .in('id', formData.player_ids);
        
        if (playerError) throw playerError;

        const seededPlayers = [...fetchedPlayerDetails]
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .map((player, index) => {
                const division = formData.divisions.find(d => player.rating >= d.min_rating && player.rating <= d.max_rating);
                return { 
                    tournament_id: newTournament.id,
                    player_id: player.id,
                    seed: index + 1,
                    rank: index + 1,
                    division: division ? division.name : null,
                };
            });
        
        const { error: joinTableError } = await supabase
            .from('tournament_players')
            .insert(seededPlayers);
            
        if (joinTableError) throw joinTableError;
        
        if (formData.type === 'team' && formData.teams.length > 0) {
            const teamRecords = formData.teams.map(t => ({
                name: t.name,
                tournament_id: newTournament.id
            }));
            
            const { data: createdTeams, error: teamError } = await supabase
                .from('teams')
                .insert(teamRecords)
                .select('id, name');
            
            if (teamError) throw teamError;

            for (const team of formData.teams) {
                const createdTeam = createdTeams.find(ct => ct.name === team.name);
                if (createdTeam) {
                    const playerIdsToUpdate = team.players.map(p => p.id);
                    await supabase
                        .from('tournament_players')
                        .update({ team_id: createdTeam.id })
                        .eq('tournament_id', newTournament.id)
                        .in('player_id', playerIdsToUpdate);
                }
            }
        }
        
        toast.success('Tournament created successfully!');
        setTimeout(() => navigate(`/tournament/${newTournament.id}/dashboard`), 1000);
    } catch (error) {
        toast.error(`Failed to create tournament: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const stepsConfig = [
      { id: 'details', label: 'Details' },
      { id: 'players', label: 'Players' },
      { id: 'divisions', label: 'Divisions' },
      ...(formData.type === 'team' ? [{ id: 'teams', label: 'Teams' }] : []),
      { id: 'rounds', label: 'Rounds' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />
      <Header />
      <AnimatePresence>
        {isReconciling && (
          <PlayerReconciliationModal
            imports={reconciliationData.imports}
            matches={reconciliationData.matches}
            onCancel={() => setIsReconciling(false)}
            onFinalize={finalizeRoster}
          />
        )}
      </AnimatePresence>
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold text-gradient mb-4">
              New Tournament Wizard
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                  {currentStep === 'players' && <PlayerRosterManager formData={formData} onStartReconciliation={startReconciliation} />}
                  {currentStep === 'divisions' && <DivisionManager formData={formData} onDivisionsChange={handleDivisionsChange} />}
                  {currentStep === 'teams' && <TeamManager formData={{...formData, player_ids: playerDetails}} onTeamUpdate={handleTeamUpdate} />}
                  {currentStep === 'rounds' && <RoundsConfiguration formData={formData} onChange={handleFormChange} errors={{}} />}
                </motion.div>
              </AnimatePresence>
                <div className="mt-8 flex justify-between items-center">
                    {currentStep !== 'details' ? (<Button variant="outline" onClick={handlePrevStep}>Back</Button>) : <div />}
                    {currentStep !== 'rounds' ? (<Button onClick={handleNextStep} disabled={formData.playerCount === 0 && currentStep === 'players'}>Next</Button>) : (<Button onClick={handleCreateTournament} loading={isLoading}>Finalize & Create</Button>)}
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TournamentSetupConfiguration;