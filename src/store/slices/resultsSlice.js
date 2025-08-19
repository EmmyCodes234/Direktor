import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabaseClient';

// Async thunks
export const fetchTournamentResults = createAsyncThunk(
  'results/fetchTournamentResults',
  async (tournamentId) => {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
);

export const fetchPendingResults = createAsyncThunk(
  'results/fetchPendingResults',
  async (tournamentId) => {
    const { data, error } = await supabase
      .from('pending_results')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }
);

export const submitResult = createAsyncThunk(
  'results/submitResult',
  async (resultData) => {
    const { data, error } = await supabase
      .from('results')
      .insert(resultData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

export const updateResult = createAsyncThunk(
  'results/updateResult',
  async ({ id, updates }) => {
    const { data, error } = await supabase
      .from('results')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

export const deleteResult = createAsyncThunk(
  'results/deleteResult',
  async (resultId) => {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', resultId);
    
    if (error) throw error;
    return resultId;
  }
);

export const approvePendingResult = createAsyncThunk(
  'results/approvePendingResult',
  async ({ pendingResultId, resultData }) => {
    // First delete the pending result
    await supabase
      .from('pending_results')
      .delete()
      .eq('id', pendingResultId);
    
    // Then create the actual result
    const { data, error } = await supabase
      .from('results')
      .insert(resultData)
      .select()
      .single();
    
    if (error) throw error;
    return { result: data, pendingResultId };
  }
);

export const rejectPendingResult = createAsyncThunk(
  'results/rejectPendingResult',
  async (pendingResultId) => {
    const { error } = await supabase
      .from('pending_results')
      .delete()
      .eq('id', pendingResultId);
    
    if (error) throw error;
    return pendingResultId;
  }
);

const initialState = {
  list: [],
  pending: [],
  loading: false,
  submitting: false,
  updating: false,
  deleting: false,
  error: null,
};

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addResult: (state, action) => {
      state.list.unshift(action.payload);
    },
    updateResultInList: (state, action) => {
      const index = state.list.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    removeResultFromList: (state, action) => {
      state.list = state.list.filter(r => r.id !== action.payload);
    },
    removePendingResult: (state, action) => {
      state.pending = state.pending.filter(r => r.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTournamentResults
      .addCase(fetchTournamentResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTournamentResults.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchTournamentResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchPendingResults
      .addCase(fetchPendingResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingResults.fulfilled, (state, action) => {
        state.loading = false;
        state.pending = action.payload;
      })
      .addCase(fetchPendingResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // submitResult
      .addCase(submitResult.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitResult.fulfilled, (state, action) => {
        state.submitting = false;
        state.list.unshift(action.payload);
      })
      .addCase(submitResult.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message;
      })
      // updateResult
      .addCase(updateResult.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateResult.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.list.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(updateResult.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message;
      })
      // deleteResult
      .addCase(deleteResult.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteResult.fulfilled, (state, action) => {
        state.deleting = false;
        state.list = state.list.filter(r => r.id !== action.payload);
      })
      .addCase(deleteResult.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.error.message;
      })
      // approvePendingResult
      .addCase(approvePendingResult.fulfilled, (state, action) => {
        state.list.unshift(action.payload.result);
        state.pending = state.pending.filter(r => r.id !== action.payload.pendingResultId);
      })
      // rejectPendingResult
      .addCase(rejectPendingResult.fulfilled, (state, action) => {
        state.pending = state.pending.filter(r => r.id !== action.payload);
      });
  },
});

export const {
  clearError,
  addResult,
  updateResultInList,
  removeResultFromList,
  removePendingResult,
} = resultsSlice.actions;

export default resultsSlice.reducer; 