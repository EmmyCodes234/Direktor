import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Icon from './AppIcon';
import { handleError } from '../utils/errorHandler';

const TournamentRecoveryModal = ({ isOpen, onClose, onTournamentRecovered }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [foundTournaments, setFoundTournaments] = useState([]);
  const [user, setUser] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
    };
    getUser();
  }, []);

  const searchTournaments = async () => {
    if (!searchTerm.trim() || !user) return;
    
    setSearching(true);
    try {
      console.log('Searching for tournaments with term:', searchTerm);
      
      // Try multiple search approaches
      let allResults = [];
      
      // Search by name (case insensitive)
      const { data: nameResults, error: nameError } = await supabase
        .from('tournaments')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false });
      
      if (nameError) {
        console.error('Name search error:', nameError);
      } else {
        console.log('Name search results:', nameResults);
        allResults = [...allResults, ...(nameResults || [])];
      }
      
      // Search by description (case insensitive)
      const { data: descResults, error: descError } = await supabase
        .from('tournaments')
        .select('*')
        .ilike('description', `%${searchTerm}%`)
        .order('created_at', { ascending: false });
      
      if (descError) {
        console.error('Description search error:', descError);
      } else {
        console.log('Description search results:', descResults);
        allResults = [...allResults, ...(descResults || [])];
      }
      
      // Remove duplicates based on ID
      const uniqueResults = allResults.filter((tournament, index, self) => 
        index === self.findIndex(t => t.id === tournament.id)
      );
      
      console.log('Final unique results:', uniqueResults);
      setFoundTournaments(uniqueResults);
      
    } catch (error) {
      console.error('Search error:', error);
      handleError(error, 'Failed to search tournaments');
    } finally {
      setSearching(false);
    }
  };

  const recoverTournament = async (tournament) => {
    if (!user) return;
    
    setRecovering(true);
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ user_id: user.id })
        .eq('id', tournament.id);
      
      if (error) throw error;
      
      // Remove from found list
      setFoundTournaments(prev => prev.filter(t => t.id !== tournament.id));
      
      // Notify parent component
      if (onTournamentRecovered) {
        onTournamentRecovered(tournament);
      }
      
    } catch (error) {
      handleError(error, 'Failed to recover tournament');
    } finally {
      setRecovering(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchTournaments();
  };



  const debugDatabase = async () => {
    setShowDebug(true);
    setDebugInfo('Loading...');
    
    try {
      console.log('Starting database debug...');
      
      // Get all tournaments to see what's in the database (no limit to see everything)
      const { data: allTournaments, error: allError } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allError) {
        setDebugInfo(`Error fetching all tournaments: ${allError.message}`);
        return;
      }
      
      console.log('All tournaments:', allTournaments);
      
      // Look for tournaments with similar names (expanded search)
      const yctTournaments = allTournaments.filter(t => 
        t.name && (
          t.name.toLowerCase().includes('yct') ||
          t.name.toLowerCase().includes('royal') ||
          t.name.toLowerCase().includes('rumble') ||
          t.name.toLowerCase().includes('1.0') ||
          t.name.toLowerCase().includes('royal rumble')
        )
      );
      
      console.log('YCT-related tournaments:', yctTournaments);
      
      // Check for tournaments without user_id
      const orphanedTournaments = allTournaments.filter(t => !t.user_id);
      
      console.log('Orphaned tournaments:', orphanedTournaments);
      
      // Check for tournaments with different user_id
      const otherUserTournaments = allTournaments.filter(t => t.user_id && t.user_id !== user?.id);
      
      console.log('Other user tournaments:', otherUserTournaments);
      
      const debugData = {
        totalTournaments: allTournaments.length,
        currentUser: user,
        yctTournaments: yctTournaments,
        orphanedTournaments: orphanedTournaments,
        otherUserTournaments: otherUserTournaments,
        allTournaments: allTournaments,
        databaseInfo: {
          supabaseUrl: supabase.supabaseUrl
        }
      };
      
      setDebugInfo(debugData);
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo(`Debug error: ${error.message}`);
    }
  };

  const recoverById = async (tournamentId) => {
    if (!user) return;
    
    setRecovering(true);
    try {
      console.log(`Attempting to recover tournament by ID: ${tournamentId}`);
      
      // Update the tournament to assign it to current user
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ user_id: user.id })
        .eq('id', tournamentId);
      
      if (updateError) {
        console.error('Error updating tournament:', updateError);
        throw updateError;
      }
      
      console.log('Tournament recovered successfully by ID!');
      
      // Refresh debug info
      await debugDatabase();
      
    } catch (error) {
      console.error('Recovery by ID error:', error);
      handleError(error, 'Failed to recover tournament by ID');
    } finally {
      setRecovering(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Search" size={24} className="text-primary" />
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Recover Missing Tournaments
          </h2>
        </div>
        
        <p className="text-muted-foreground mb-6">
          If you can't find some of your previously created tournaments, you can search for them here and recover them to your account.
        </p>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by tournament name..."
              className="flex-1 px-4 py-2 bg-muted/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button 
              type="submit" 
              disabled={!searchTerm.trim() || searching}
              className="px-6"
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>
        

        


        <div className="mb-6 p-4 bg-warning/5 border border-warning/20 rounded-lg">
          <h4 className="font-semibold text-warning mb-2">Database Debug</h4>
          <p className="text-sm text-muted-foreground mb-3">
            If the above methods don't work, let's debug the database to see what tournaments exist:
          </p>
          <Button
            onClick={debugDatabase}
            disabled={debugInfo === 'Loading...'}
            className="w-full"
            variant="outline"
          >
            {debugInfo === 'Loading...' ? 'Loading...' : 'Debug Database'}
          </Button>
        </div>

        {showDebug && debugInfo && (
          <div className="mb-6 p-4 bg-muted/20 border border-border rounded-lg">
            <h4 className="font-semibold text-foreground mb-3">Database Debug Results</h4>
            {typeof debugInfo === 'string' ? (
              <p className="text-sm text-muted-foreground">{debugInfo}</p>
            ) : (
                             <div className="space-y-4">
                 <div>
                   <h5 className="font-medium text-foreground mb-2">Database Information</h5>
                   <p className="text-sm text-muted-foreground mb-2">
                     Total Tournaments: {debugInfo.totalTournaments} | 
                     Current User: {debugInfo.currentUser?.email || 'Not logged in'} | 
                     User ID: {debugInfo.currentUser?.id || 'None'}
                   </p>
                   <p className="text-sm text-muted-foreground">
                     Database URL: {debugInfo.databaseInfo.supabaseUrl}
                   </p>
                 </div>
                
                {debugInfo.yctTournaments.length > 0 && (
                  <div>
                    <h5 className="font-medium text-foreground mb-2">YCT-Related Tournaments:</h5>
                    <div className="space-y-2">
                      {debugInfo.yctTournaments.map((tournament) => (
                        <div key={tournament.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{tournament.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {tournament.id} | Created: {new Date(tournament.created_at).toLocaleDateString()}
                              {tournament.user_id ? ` | User ID: ${tournament.user_id}` : ' | No User ID'}
                            </p>
                          </div>
                          {!tournament.user_id && (
                            <Button
                              onClick={() => recoverById(tournament.id)}
                              disabled={recovering}
                              size="sm"
                            >
                              {recovering ? 'Recovering...' : 'Recover'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                                 {debugInfo.orphanedTournaments.length > 0 && (
                   <div>
                     <h5 className="font-medium text-foreground mb-2">Orphaned Tournaments (No User ID):</h5>
                     <div className="space-y-2">
                       {debugInfo.orphanedTournaments.slice(0, 5).map((tournament) => (
                         <div key={tournament.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                           <div>
                             <p className="font-medium text-foreground">{tournament.name}</p>
                             <p className="text-sm text-muted-foreground">
                               ID: {tournament.id} | Created: {new Date(tournament.created_at).toLocaleDateString()}
                             </p>
                           </div>
                           <Button
                             onClick={() => recoverById(tournament.id)}
                             disabled={recovering}
                             size="sm"
                           >
                             {recovering ? 'Recovering...' : 'Recover'}
                           </Button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {debugInfo.otherUserTournaments.length > 0 && (
                   <div>
                     <h5 className="font-medium text-foreground mb-2">Other User Tournaments:</h5>
                     <div className="space-y-2">
                       {debugInfo.otherUserTournaments.slice(0, 5).map((tournament) => (
                         <div key={tournament.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                           <div>
                             <p className="font-medium text-foreground">{tournament.name}</p>
                             <p className="text-sm text-muted-foreground">
                               ID: {tournament.id} | User ID: {tournament.user_id} | Created: {new Date(tournament.created_at).toLocaleDateString()}
                             </p>
                           </div>
                           <span className="text-sm text-muted-foreground">Assigned to another user</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 <div>
                   <h5 className="font-medium text-foreground mb-2">All Tournaments in Database:</h5>
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                     {debugInfo.allTournaments.map((tournament) => (
                       <div key={tournament.id} className="p-2 bg-muted/5 rounded text-xs">
                         <p className="font-medium">{tournament.name}</p>
                         <p className="text-muted-foreground">
                           ID: {tournament.id} | User: {tournament.user_id || 'None'} | Created: {new Date(tournament.created_at).toLocaleDateString()}
                         </p>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {foundTournaments.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">
              Found Tournaments ({foundTournaments.length})
            </h3>
            {foundTournaments.map((tournament) => (
              <div 
                key={tournament.id} 
                className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{tournament.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(tournament.created_at).toLocaleDateString()}
                    {tournament.user_id && (
                      <span className="ml-2 text-warning">Already assigned to another user</span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => recoverTournament(tournament)}
                  disabled={recovering || tournament.user_id}
                  size="sm"
                  variant={tournament.user_id ? "ghost" : "default"}
                >
                  {tournament.user_id ? 'Already Assigned' : 'Recover'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchTerm && !searching && foundTournaments.length === 0 && !showDebug && (
          <div className="text-center py-8">
            <Icon name="SearchX" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tournaments found matching your search.</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border/30">
          <h4 className="font-semibold text-foreground mb-3">Troubleshooting Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Try searching with partial tournament names</li>
            <li>• Check if you're logged in with the correct account</li>
            <li>• Tournaments created before user authentication may need to be recovered</li>
            <li>• Use the Database Debug feature to see all tournaments in the system</li>
            <li>• Contact support if you still can't find your tournaments</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default TournamentRecoveryModal; 