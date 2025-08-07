import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
  const { action, payload } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    if (!action || !payload) {
      return new Response(JSON.stringify({ error: 'Missing action or payload' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (action === 'insert_result') {
      const { error } = await supabase.from('results').insert(payload);
      if (error) throw error;
    } else if (action === 'update_result') {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('results').update(rest).eq('id', id);
      if (error) throw error;
    } else {
      throw new Error("Invalid action type.");
    }

    // Recalculate stats for all players in this tournament
    const { data: allResults, error: resultsError } = await supabase
      .from('results')
      .select('*')
      .eq('tournament_id', payload.tournament_id);

    if (resultsError) throw resultsError;

    const playerStats: Record<string, { wins: number; losses: number; ties: number; spread: number }> = {};

    for (const result of allResults) {
      const { player1_id, player2_id, score1, score2 } = result;

      if (!playerStats[player1_id]) playerStats[player1_id] = { wins: 0, losses: 0, ties: 0, spread: 0 };
      if (!playerStats[player2_id]) playerStats[player2_id] = { wins: 0, losses: 0, ties: 0, spread: 0 };

      const spread = score1 - score2;

      if (score1 > score2) {
        playerStats[player1_id].wins += 1;
        playerStats[player2_id].losses += 1;
      } else if (score2 > score1) {
        playerStats[player2_id].wins += 1;
        playerStats[player1_id].losses += 1;
      } else {
        playerStats[player1_id].ties += 1;
        playerStats[player2_id].ties += 1;
      }

      playerStats[player1_id].spread += spread;
      playerStats[player2_id].spread -= spread;
    }

    for (const [player_id, stats] of Object.entries(playerStats)) {
      await supabase
        .from('tournament_players')
        .update(stats)
        .eq('player_id', player_id)
        .eq('tournament_id', payload.tournament_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error('Edge Function Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
