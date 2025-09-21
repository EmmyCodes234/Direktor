import { supabase } from './src/supabaseClient';

async function checkTournaments() {
  console.log('Checking tournaments...');
  
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
  tournaments.forEach(tournament => {
    console.log(`- ${tournament.name} (${tournament.slug}) - Type: ${tournament.type}`);
  });

  // If there are tournaments, check the first one
  if (tournaments.length > 0) {
    const firstTournament = tournaments[0];
    console.log('\nFirst tournament details:');
    console.log(firstTournament);
    
    // Check players
    const { data: players, error: playersError } = await supabase
      .from('tournament_players')
      .select('*, players (*)')
      .eq('tournament_id', firstTournament.id);

    if (playersError) {
      console.error('Error fetching players:', playersError);
    } else {
      console.log(`\nFound ${players.length} players in tournament:`);
      players.forEach(player => {
        console.log(`- ${player.players.name} (Seed: ${player.seed})`);
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
      matches.forEach(match => {
        console.log(`- Round ${match.round}: Player ${match.player1_id} vs Player ${match.player2_id}`);
      });
    }
  }
}

checkTournaments();