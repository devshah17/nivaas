import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface TiffinEntry {
  _id?: string;
  customer: { _id?: string } | Record<string, unknown>;
  lunchStatus: string;
  lunchExtra: number;
  dinnerStatus: string;
  dinnerExtra: number;
  lunchPaymentStatus?: string;
  dinnerPaymentStatus?: string;
  lunchBill?: string | null;
  dinnerBill?: string | null;
}

interface TiffinsState {
  entries: TiffinEntry[];
  loading: boolean;
  error: string | null;
  date: string;
}

export const fetchTiffinEntries = createAsyncThunk(
  'tiffins/fetchEntries',
  async ({ orgId, date }: { orgId: string, date: string }) => {
    const res = await fetch(`/api/organizations/${orgId}/tiffins?date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.entries;
  }
);

export const updateTiffinEntryAsync = createAsyncThunk(
  'tiffins/updateEntry',
  async ({ orgId, customerId, date, field, value, currentEntry, members }: { orgId: string; customerId: string; date: string; field: string; value: string; currentEntry: TiffinEntry; members: { user: { _id: string } }[] }, { rejectWithValue }) => {
    const payload = {
      customerId,
      date,
      lunchStatus: currentEntry.lunchStatus,
      lunchExtra: currentEntry.lunchExtra,
      dinnerStatus: currentEntry.dinnerStatus,
      dinnerExtra: currentEntry.dinnerExtra,
      [field]: value
    };

    const res = await fetch(`/api/organizations/${orgId}/tiffins`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return rejectWithValue('Failed to update');
    const data = await res.json();
    const newEntry = data.entry;
    
    const memberInfo = members.find((m) => m.user._id === customerId);
    if (memberInfo) {
      newEntry.customer = memberInfo.user;
    }
    
    return newEntry;
  }
);

const initialState: TiffinsState = {
  entries: [],
  loading: false,
  error: null,
  date: new Date().toISOString().split("T")[0]
};

const tiffinsSlice = createSlice({
  name: 'tiffins',
  initialState,
  reducers: {
    setDate(state, action: PayloadAction<string>) {
      state.date = action.payload;
    },
    optimisticUpdate(state, action: PayloadAction<{ customerId: string, field: string, value: string, memberInfo: { user: Record<string, unknown> } | undefined }>) {
      const { customerId, field, value, memberInfo } = action.payload;
      const index = state.entries.findIndex(e => (e.customer?._id || e.customer) === customerId);
      if (index >= 0) {
        (state.entries[index] as Record<string, unknown>)[field] = value;
      } else {
        // Create optimistic entry
        state.entries.push({
          customer: memberInfo?.user || { _id: customerId },
          lunchStatus: field === 'lunchStatus' ? value : 'none',
          lunchExtra: 0,
          dinnerStatus: field === 'dinnerStatus' ? value : 'none',
          dinnerExtra: 0
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTiffinEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTiffinEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(fetchTiffinEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      .addCase(updateTiffinEntryAsync.fulfilled, (state, action) => {
        const index = state.entries.findIndex(e => (e.customer?._id || e.customer) === action.payload.customer._id);
        if (index >= 0) {
          state.entries[index] = action.payload;
        } else {
          state.entries.push(action.payload);
        }
      });
  }
});

export const { setDate, optimisticUpdate } = tiffinsSlice.actions;
export default tiffinsSlice.reducer;
