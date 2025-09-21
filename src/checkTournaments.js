// Simple script to check tournaments in the database
import { supabase } from './supabaseClient';

async function checkTournaments() {
  try {
    console.log('Checking for existing tournaments...');
    
    // Fetch all published tournaments
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return;
    }

    console.log(`Found ${tournaments.length} published tournaments:`);
    tournaments.forEach((tournament, index) => {
      console.log(`${index + 1}. ${tournament.name} (${tournament.slug}) - Type: ${tournament.type}`);
    });

    if (tournaments.length > 0) {
      const firstTournament = tournaments[0];
      console.log('\nFirst tournament details:');
      console.log('ID:', firstTournament.id);
      console.log('Name:', firstTournament.name);
      console.log('Slug:', firstTournament.slug);
      console.log('Type:', firstTournament.type);
      
      // Check players in this tournament
      const { data: players, error: playersError } = await supabase
        .from('tournament_players')
        .select('*, players (id, name, rating)')
        .eq('tournament_id', firstTournament.id);

      if (playersError) {
        console.error('Error fetching players:', playersError);
      } else {
        console.log(`\nFound ${players.length} players in tournament:`);
        players.forEach((player, index) => {
          console.log(`${index + 1}. ${player.players.name} (Seed: ${player.seed}, Rating: ${player.players.rating})`);
        });
      }
      
      // Check matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', firstTournament.id);

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
      } else {
        console.log(`\nFound ${matches.length} matches in tournament:`);
        matches.forEach((match, index) => {
          console.log(`${index + 1}. Round ${match.round}: Player ${match.player1_id} vs Player ${match.player2_id} (Complete: ${match.is_complete})`);
        });
      }
      
      // Check results
      const { data: results, error: resultsError } = await supabase
        .from('results')
        .select('*')
        .eq('tournament_id', firstTournament.id);

      if (resultsError) {
        console.error('Error fetching results:', resultsError);
      } else {
        console.log(`\nFound ${results.length} results in tournament:`);
        results.forEach((result, index) => {
          console.log(`${index + 1}. Round ${result.round}: ${result.player1_name} ${result.score1} - ${result.score2} ${result.player2_name}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
checkTournaments();