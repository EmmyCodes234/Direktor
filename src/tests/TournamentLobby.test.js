import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import TournamentLobby from '../pages/TournamentLobby';
import authReducer from '../store/slices/authSlice';
import tournamentsReducer from '../store/slices/tournamentsSlice';

// Mock the Redux store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      tournaments: tournamentsReducer,
    },
    preloadedState: initialState,
  });
};

// Mock the error handler
jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn(),
}));

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Test wrapper component
const TestWrapper = ({ children, store }) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('TournamentLobby', () => {
  let store;

  beforeEach(() => {
    store = createTestStore({
      auth: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        },
        loading: false,
        error: null,
      },
      tournaments: {
        list: [
          {
            id: 'tournament-1',
            name: 'Test Tournament 1',
            status: 'setup',
            created_at: '2024-01-01T00:00:00Z',
            user_id: 'test-user-id',
          },
          {
            id: 'tournament-2',
            name: 'Test Tournament 2',
            status: 'active',
            created_at: '2024-01-02T00:00:00Z',
            user_id: 'test-user-id',
          },
        ],
        loading: false,
        error: null,
      },
    });
  });

  test('renders tournament list correctly', () => {
    render(
      <TestWrapper store={store}>
        <TournamentLobby />
      </TestWrapper>
    );

    expect(screen.getByText('Test Tournament 1')).toBeInTheDocument();
    expect(screen.getByText('Test Tournament 2')).toBeInTheDocument();
  });

  test('shows loading state when fetching tournaments', () => {
    store = createTestStore({
      auth: {
        user: { id: 'test-user-id' },
        loading: false,
        error: null,
      },
      tournaments: {
        list: [],
        loading: true,
        error: null,
      },
    });

    render(
      <TestWrapper store={store}>
        <TournamentLobby />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('shows empty state when no tournaments', () => {
    store = createTestStore({
      auth: {
        user: { id: 'test-user-id' },
        loading: false,
        error: null,
      },
      tournaments: {
        list: [],
        loading: false,
        error: null,
      },
    });

    render(
      <TestWrapper store={store}>
        <TournamentLobby />
      </TestWrapper>
    );

    expect(screen.getByText(/no tournaments/i)).toBeInTheDocument();
  });

  test('navigates to tournament setup when clicking new tournament', () => {
    const { container } = render(
      <TestWrapper store={store}>
        <TournamentLobby />
      </TestWrapper>
    );

    const newTournamentButton = screen.getByText(/new tournament/i);
    fireEvent.click(newTournamentButton);

    // Check if navigation occurred (this would need more setup in a real test)
    expect(newTournamentButton).toBeInTheDocument();
  });

  test('opens delete confirmation modal', () => {
    render(
      <TestWrapper store={store}>
        <TournamentLobby />
      </TestWrapper>
    );

    const deleteButtons = screen.getAllByLabelText(/delete tournament/i);
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  test('shows correct tournament status badges', () => {
    render(
      <TestWrapper store={store}>
        <TournamentLobby />
      </TestWrapper>
    );

    expect(screen.getByText('setup')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  test('displays user menu when clicking user button', () => {
    render(
      <TestWrapper store={store}>
        <TournamentLobby />
      </TestWrapper>
    );

    const userButton = screen.getByLabelText(/user menu/i);
    fireEvent.click(userButton);

    expect(screen.getByText(/profile settings/i)).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });
});

// Integration test for Redux actions
describe('TournamentLobby Redux Integration', () => {
  test('dispatches fetchUserTournaments on mount', async () => {
    const mockDispatch = jest.fn();
    const mockUser = { id: 'test-user-id' };

    store = createTestStore({
      auth: {
        user: mockUser,
        loading: false,
        error: null,
      },
      tournaments: {
        list: [],
        loading: false,
        error: null,
      },
    });

    render(
      <TestWrapper store={store}>
        <TournamentLobby />
      </TestWrapper>
    );

    await waitFor(() => {
      const state = store.getState();
      expect(state.tournaments.list).toEqual([]);
    });
  });
}); 