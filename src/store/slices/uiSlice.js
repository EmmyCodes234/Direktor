import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: {
    global: false,
    tournaments: false,
    players: false,
    results: false,
  },
  modals: {
    scoreEntry: { isOpen: false, data: null },
    confirmation: { isOpen: false, data: null },
    playerStats: { isOpen: false, data: null },
  },
  notifications: [],
  sidebar: {
    isOpen: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      if (key === 'global') {
        state.loading.global = value;
      } else {
        state.loading[key] = value;
      }
    },
    openModal: (state, action) => {
      const { modal, data } = action.payload;
      state.modals[modal] = { isOpen: true, data };
    },
    closeModal: (state, action) => {
      const { modal } = action.payload;
      state.modals[modal] = { isOpen: false, data: null };
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      );
    },
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebar.isOpen = action.payload;
    },
  },
});

export const {
  setLoading,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

export default uiSlice.reducer; 