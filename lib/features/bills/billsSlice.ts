import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';
import axios from 'axios';

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
    const data = await api.bills.get(orgId, periodName);
    return data.bills;
  }
);

export const generateBillsAsync = createAsyncThunk(
  'bills/generate',
  async ({ orgId, params }: { orgId: string, params: Record<string, unknown> }) => {
    try {
      const data = await api.bills.generate(orgId, params);
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to generate bills');
      }
      throw new Error('Failed to generate bills');
    }
  }
);

export const toggleBillStatusAsync = createAsyncThunk(
  'bills/toggleStatus',
  async ({ orgId, billId, currentStatus }: { orgId: string, billId: string, currentStatus: string }) => {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    await api.bills.updateStatus(orgId, billId, { status: newStatus });
    return { billId, status: newStatus };
  }
);

export const updateChargesAsync = createAsyncThunk(
  'bills/updateCharges',
  async ({ orgId, billId, otherCharges, otherChargesNote }: { orgId: string; billId: string; otherCharges: number; otherChargesNote?: string }) => {
    await api.bills.updateCharges(orgId, billId, {
      otherCharges: Number(otherCharges),
      otherChargesNote
    });
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
