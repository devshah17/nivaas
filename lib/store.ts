import { configureStore } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import tiffinsReducer from './features/tiffins/tiffinsSlice';
import rentalsReducer from './features/rentals/rentalsSlice';
import billsReducer from './features/bills/billsSlice';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    }
  }
});

export const { toggleSidebar, setSidebarOpen } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    tiffins: tiffinsReducer,
    rentals: rentalsReducer,
    bills: billsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
