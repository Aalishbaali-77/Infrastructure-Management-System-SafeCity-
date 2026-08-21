import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Discipline {
  id: string;
  name: string;
  label: string;
}

interface DisciplinesState {
  list: Discipline[];
}

const DEFAULTS: Discipline[] = [
  { id: 'd1', name: 'CIVIL', label: 'Civil' },
  { id: 'd2', name: 'ELECTRICAL', label: 'Electrical' },
  { id: 'd3', name: 'FIBER', label: 'Fiber' },
  { id: 'd4', name: 'CONDUIT', label: 'Conduit' },
  { id: 'd5', name: 'NETWORKING', label: 'Networking' },
];

const initialState: DisciplinesState = { list: DEFAULTS };

const disciplinesSlice = createSlice({
  name: 'disciplines',
  initialState,
  reducers: {
    setDisciplines: (state, action: PayloadAction<Discipline[]>) => {
      state.list = action.payload;
    },
  },
});

export const { setDisciplines } = disciplinesSlice.actions;
export default disciplinesSlice.reducer;
