import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SchoolSettings {
  id: string;
  name: string;
  enabledModules: string[] | null;
  licensedRoles: string[] | null;
  licensePlan: string | null;
}

interface SettingsState {
  school: SchoolSettings | null;
  isLoading: boolean;
}

const initialState: SettingsState = {
  school: null,
  isLoading: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSchoolSettings: (state, action: PayloadAction<SchoolSettings>) => {
      state.school = action.payload;
      state.isLoading = false;
    },
    setSettingsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateEnabledModules: (state, action: PayloadAction<string[]>) => {
      if (state.school) {
        state.school.enabledModules = action.payload;
      }
    },
  },
});

export const { setSchoolSettings, setSettingsLoading, updateEnabledModules } = settingsSlice.actions;
export default settingsSlice.reducer;
