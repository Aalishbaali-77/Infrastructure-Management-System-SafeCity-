import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { WorkPackage } from '@/types/workPackage';

interface WorkPackagesState {
  list: WorkPackage[];
}

const initialState: WorkPackagesState = { list: [] };

const workPackagesSlice = createSlice({
  name: 'workPackages',
  initialState,
  reducers: {
    setWorkPackages: (state, action: PayloadAction<WorkPackage[]>) => {
      state.list = action.payload;
    },
    addWorkPackage: (state, action: PayloadAction<WorkPackage>) => {
      state.list.push(action.payload);
    },
    updateWorkPackage: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<WorkPackage> }>
    ) => {
      const row = state.list.find((w) => w.id === action.payload.id);
      if (row) Object.assign(row, action.payload.changes);
    },
    deleteWorkPackage: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((w) => w.id !== action.payload);
    },
  },
});

export const { setWorkPackages, addWorkPackage, updateWorkPackage, deleteWorkPackage } =
  workPackagesSlice.actions;
export default workPackagesSlice.reducer;
