import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Bill {
  _id: string;
  customer: { _id: string; name: string };
  periodName: string;
  startDate: string;
  endDate: string;
  tiffinCount: number;
  tiffinRate: number;
  tiffinTotal: number;
  rentAmount: number;
  otherCharges: number;
  otherChargesNote: string;
  totalAmount: number;
  status: string;
  tiffins?: Record<string, unknown>[];
}

interface BillsState {
  bills: Bill[];
  loading: boolean;
  error: string | null;
}

export const fetchBillsAsync = createAsyncThunk(
  'bills/fetchBills',
  async ({ orgId, periodName }: { orgId: string, periodName: string }) => {
    const res = await fetch(`/api/organizations/${orgId}/bills?periodName=${periodName}`);
    if (!res.ok) throw new Error('Failed to fetch bills');
    const data = await res.json();
    return data.bills;
  }
);

export const generateBillsAsync = createAsyncThunk(
  'bills/generate',
  async ({ orgId, params }: { orgId: string, params: Record<string, unknown> }) => {
    const res = await fetch(`/api/organizations/${orgId}/bills/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate bills');
    return data;
  }
);

export const toggleBillStatusAsync = createAsyncThunk(
  'bills/toggleStatus',
  async ({ orgId, billId, currentStatus }: { orgId: string, billId: string, currentStatus: string }) => {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    const res = await fetch(`/api/organizations/${orgId}/bills/${billId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return { billId, status: newStatus };
  }
);

export const updateChargesAsync = createAsyncThunk(
  'bills/updateCharges',
  async ({ orgId, billId, otherCharges, otherChargesNote }: { orgId: string; billId: string; otherCharges: number; otherChargesNote?: string }) => {
    const res = await fetch(`/api/organizations/${orgId}/bills/${billId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        otherCharges: Number(otherCharges),
        otherChargesNote
      }),
    });
    if (!res.ok) throw new Error('Failed to update charges');
    return { billId, otherCharges: Number(otherCharges), otherChargesNote };
  }
);

const initialState: BillsState = {
  bills: [],
  loading: false,
  error: null,
};

const billsSlice = createSlice({
  name: 'bills',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchBillsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.bills = action.payload;
      })
      .addCase(fetchBillsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      // Toggle Status
      .addCase(toggleBillStatusAsync.fulfilled, (state, action) => {
        const index = state.bills.findIndex(b => b._id === action.payload.billId);
        if (index >= 0) {
          state.bills[index].status = action.payload.status;
        }
      })
      // Update Charges
      .addCase(updateChargesAsync.fulfilled, (state, action) => {
        const index = state.bills.findIndex(b => b._id === action.payload.billId);
        if (index >= 0) {
          const bill = state.bills[index];
          // Recalculate total
          const oldCharges = bill.otherCharges || 0;
          const diff = action.payload.otherCharges - oldCharges;
          bill.otherCharges = action.payload.otherCharges;
          bill.otherChargesNote = action.payload.otherChargesNote ?? "";
          bill.totalAmount += diff;
        }
      });
  }
});

export default billsSlice.reducer;
