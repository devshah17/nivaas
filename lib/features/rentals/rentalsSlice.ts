import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api/client';

interface Tenant {
  _id: string;
  name: string;
  email: string;
}

interface RentalUnit {
  _id: string;
  roomName: string;
  bedName: string;
  rentAmount: number;
  moveInDate: string;
  tenant: Tenant | null;
}

interface RentalsState {
  units: RentalUnit[];
  loading: boolean;
  error: string | null;
}

export const fetchRentalUnits = createAsyncThunk(
  'rentals/fetchUnits',
  async (orgId: string) => {
    const data = await api.rentals.list(orgId);
    return data.units;
  }
);

export const addRentalUnitAsync = createAsyncThunk(
  'rentals/addUnit',
  async ({ orgId, roomName, bedName }: { orgId: string; roomName: string; bedName?: string }) => {
    const data = await api.rentals.create(orgId, { roomName, bedName });
    return data.unit;
  }
);

export const assignTenantAsync = createAsyncThunk(
  'rentals/assignTenant',
  async ({ orgId, unitId, tenant, rentAmount, moveInDate, tenantInfo }: { orgId: string; unitId: string; tenant: string; rentAmount: number; moveInDate: string; tenantInfo?: Tenant }) => {
    const data = await api.rentals.assign(orgId, unitId, {
      tenant,
      rentAmount: Number(rentAmount),
      moveInDate,
    });
    
    // Attach tenant info for optimistic/instant UI update
    const updatedUnit = { ...data.unit, tenant: tenantInfo };
    return updatedUnit;
  }
);

export const removeTenantAsync = createAsyncThunk(
  'rentals/removeTenant',
  async ({ orgId, unitId }: { orgId: string, unitId: string }) => {
    const data = await api.rentals.remove(orgId, unitId, { clearTenant: true });
    return data.unit;
  }
);

export const deleteRentalUnitAsync = createAsyncThunk(
  'rentals/deleteUnit',
  async ({ orgId, unitId }: { orgId: string, unitId: string }) => {
    await api.rentals.delete(orgId, unitId);
    return unitId;
  }
);

const initialState: RentalsState = {
  units: [],
  loading: false,
  error: null,
};

const rentalsSlice = createSlice({
  name: 'rentals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Units
      .addCase(fetchRentalUnits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRentalUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.units = action.payload;
      })
      .addCase(fetchRentalUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed';
      })
      // Add Unit
      .addCase(addRentalUnitAsync.fulfilled, (state, action) => {
        state.units.push(action.payload);
      })
      // Assign Tenant
      .addCase(assignTenantAsync.fulfilled, (state, action) => {
        const index = state.units.findIndex(u => u._id === action.payload._id);
        if (index >= 0) {
          state.units[index] = action.payload;
        }
      })
      // Remove Tenant
      .addCase(removeTenantAsync.fulfilled, (state, action) => {
        const index = state.units.findIndex(u => u._id === action.payload._id);
        if (index >= 0) {
          state.units[index] = action.payload;
        }
      })
      // Delete Unit
      .addCase(deleteRentalUnitAsync.fulfilled, (state, action) => {
        state.units = state.units.filter(u => u._id !== action.payload);
      });
  }
});

export default rentalsSlice.reducer;
