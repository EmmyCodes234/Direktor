import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabaseClient';

// Async thunks
export const fetchUserTournaments = createAsyncThunk(
  'tournaments/fetchUserTournaments',
  async (userId) => {
    console.log('Fetching tournaments for user:', userId);

    if (!userId) {
      console.error('No userId provided to fetchUserTournaments');
      throw new Error('User ID is required to fetch tournaments');
    }

    // Fetch managed tournaments (Owned + Shared) via RPC
    const { data: managedTournaments, error: managedError } = await supabase
      .rpc('get_managed_tournaments')
      .order('created_at', { ascending: false });

    if (managedError) {
      console.error('Error fetching managed tournaments via RPC:', managedError);
      // Fallback or throw? If RPC missing, this throws.
      // If we assume migration is applied, throw.
      throw managedError;
    }

    console.log(`Found ${managedTournaments?.length || 0} managed tournaments`);

    // Also check for tournaments without user_id (legacy data)
    const { data: legacyTournaments, error: legacyError } = await supabase
      .from('tournaments')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false });

    if (legacyError) {
      console.error('Error fetching legacy tournaments:', legacyError);
    } else {
      console.log(`Found ${legacyTournaments?.length || 0} legacy tournaments without user_id:`, legacyTournaments);
    }

    // Combine both results, deduplicating just in case
    const allTournaments = [
      ...(managedTournaments || []),
      ...(legacyTournaments || [])
    ];

    // Simple dedupe by ID
    const uniqueTournaments = Array.from(new Map(allTournaments.map(t => [t.id, t])).values());

    console.log(`Total tournaments found: ${uniqueTournaments.length}`);
    return uniqueTournaments;
  }
);

export const fetchTournamentBySlug = createAsyncThunk(
  'tournaments/fetchTournamentBySlug',
  async (slug) => {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_players (
          *,
          players (*)
        ),
        results (*),
        teams (*),
        matches (*),
        prizes (*)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  }
);

export const createTournament = createAsyncThunk(
  'tournaments/createTournament',
  async (tournamentData) => {
    const { data, error } = await supabase
      .from('tournaments')
      .insert(tournamentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const updateTournament = createAsyncThunk(
  'tournaments/updateTournament',
  async ({ id, updates }) => {
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const deleteTournament = createAsyncThunk(
  'tournaments/deleteTournament',
  async ({ id, userId }) => {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return id;
  }
);

const initialState = {
  list: [],
  current: null,
  loading: false,
  error: null,
  creating: false,
  updating: false,
  deleting: false,
};

const tournamentsSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTournament: (state, action) => {
      state.current = action.payload;
    },
    clearCurrentTournament: (state) => {
      state.current = null;
    },
    updateTournamentInList: (state, action) => {
      const index = state.list.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserTournaments
      .addCase(fetchUserTournaments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTournaments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUserTournaments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchTournamentBySlug
      .addCase(fetchTournamentBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTournamentBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchTournamentBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // createTournament
      .addCase(createTournament.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTournament.fulfilled, (state, action) => {
        state.creating = false;
        state.list.unshift(action.payload);
      })
      .addCase(createTournament.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message;
      })
      // updateTournament
      .addCase(updateTournament.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTournament.fulfilled, (state, action) => {
        state.updating = false;
        if (state.current?.id === action.payload.id) {
          state.current = action.payload;
        }
        const index = state.list.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(updateTournament.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message;
      })
      // deleteTournament
      .addCase(deleteTournament.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteTournament.fulfilled, (state, action) => {
        state.deleting = false;
        state.list = state.list.filter(t => t.id !== action.payload);
        if (state.current?.id === action.payload) {
          state.current = null;
        }
      })
      .addCase(deleteTournament.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.error.message;
      });
  },
});

export const {
  clearError,
  setCurrentTournament,
  clearCurrentTournament,
  updateTournamentInList
} = tournamentsSlice.actions;

export default tournamentsSlice.reducer; 