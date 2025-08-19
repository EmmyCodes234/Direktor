import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tournamentsReducer from './slices/tournamentsSlice';
import playersReducer from './slices/playersSlice';
import resultsReducer from './slices/resultsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tournaments: tournamentsReducer,
    players: playersReducer,
    results: resultsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Type definitions for TypeScript (when migrated)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch; 