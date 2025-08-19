import { useDispatch, useSelector } from 'react-redux';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;

// Auth hooks
export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  return auth;
};

export const useUser = () => {
  const user = useAppSelector((state) => state.auth.user);
  return user;
};

// Tournament hooks
export const useTournaments = () => {
  const tournaments = useAppSelector((state) => state.tournaments);
  return tournaments;
};

export const useCurrentTournament = () => {
  const currentTournament = useAppSelector((state) => state.tournaments.current);
  return currentTournament;
};

export const useUserTournaments = () => {
  const userTournaments = useAppSelector((state) => state.tournaments.list);
  return userTournaments;
};

// Players hooks
export const usePlayers = () => {
  const players = useAppSelector((state) => state.players);
  return players;
};

export const useTournamentPlayers = () => {
  const players = useAppSelector((state) => state.players.list);
  return players;
};

// Results hooks
export const useResults = () => {
  const results = useAppSelector((state) => state.results);
  return results;
};

export const useTournamentResults = () => {
  const results = useAppSelector((state) => state.results.list);
  return results;
};

export const usePendingResults = () => {
  const pendingResults = useAppSelector((state) => state.results.pending);
  return pendingResults;
};

// UI hooks
export const useUI = () => {
  const ui = useAppSelector((state) => state.ui);
  return ui;
};

export const useLoading = (key = 'global') => {
  const loading = useAppSelector((state) => state.ui.loading[key]);
  return loading;
};

export const useModal = (modalName) => {
  const modal = useAppSelector((state) => state.ui.modals[modalName]);
  return modal;
};

export const useNotifications = () => {
  const notifications = useAppSelector((state) => state.ui.notifications);
  return notifications;
};

export const useSidebar = () => {
  const sidebar = useAppSelector((state) => state.ui.sidebar);
  return sidebar;
}; 