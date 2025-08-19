import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabaseClient';

// Async thunks
export const fetchTournamentPlayers = createAsyncThunk(
  'players/fetchTournamentPlayers',
  async (tournamentId) => {
    const { data, error } = await supabase
      .from('tournament_players')
      .select(`
        *,
        players (*)
      `)
      .eq('tournament_id', tournamentId);
    
    if (error) throw error;
    return data.map(tp => ({ ...tp.players, ...tp }));
  }
);

export const addPlayerToTournament = createAsyncThunk(
  'players/addPlayerToTournament',
  async ({ tournamentId, playerName }) => {
    // First check if player exists
    let { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('name', playerName)
      .single();

    let playerId;
    if (existingPlayer) {
      playerId = existingPlayer.id;
    } else {
      // Create new player
      const { data: newPlayer, error: newPlayerError } = await supabase
        .from('players')
        .insert({ name: playerName })
        .select('id, name')
        .single();
      
      if (newPlayerError) throw newPlayerError;
      playerId = newPlayer.id;
    }

    // Add player to tournament
    const { data, error } = await supabase
      .from('tournament_players')
      .insert({
        tournament_id: tournamentId,
        player_id: playerId,
        seed: 0,
        rank: 0,
        match_wins: 0,
        match_losses: 0,
      })
      .select(`
        *,
        players (*)
      `)
      .single();
    
    if (error) throw error;
    return { ...data.players, ...data };
  }
);

export const updatePlayerStats = createAsyncThunk(
  'players/updatePlayerStats',
  async ({ tournamentId, playerId, stats }) => {
    const { data, error } = await supabase
      .from('tournament_players')
      .update(stats)
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .select(`
        *,
        players (*)
      `)
      .single();
    
    if (error) throw error;
    return { ...data.players, ...data };
  }
);

const initialState = {
  list: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
};

const playersSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePlayerInList: (state, action) => {
      const index = state.list.findIndex(p => p.player_id === action.payload.player_id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    removePlayerFromList: (state, action) => {
      state.list = state.list.filter(p => p.player_id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTournamentPlayers
      .addCase(fetchTournamentPlayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTournamentPlayers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchTournamentPlayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // addPlayerToTournament
      .addCase(addPlayerToTournament.pending, (state) => {
        state.adding = true;
        state.error = null;
      })
      .addCase(addPlayerToTournament.fulfilled, (state, action) => {
        state.adding = false;
        state.list.push(action.payload);
      })
      .addCase(addPlayerToTournament.rejected, (state, action) => {
        state.adding = false;
        state.error = action.error.message;
      })
      // updatePlayerStats
      .addCase(updatePlayerStats.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updatePlayerStats.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.list.findIndex(p => p.player_id === action.payload.player_id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(updatePlayerStats.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError, updatePlayerInList, removePlayerFromList } = playersSlice.actions;
export default playersSlice.reducer; 