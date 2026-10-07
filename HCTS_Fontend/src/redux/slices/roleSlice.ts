import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getAllRolesAction } from "@/redux/actions/roleActions";
import type { InitialState } from "@/utils/interface";

interface RoleState extends InitialState {
  roles: any[];
  errorMessage: string | null;
}

const initialState: RoleState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  roles: [],
  errorMessage: null,
};

const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    clearRoles(state) {
      state.roles = [];
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllRolesAction.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.errorMessage = null;
      })
      .addCase(getAllRolesAction.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.roles = action.payload;
      })
      .addCase(getAllRolesAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload as string || action.error.message || "Failed to fetch roles";
      });
  },
});

export const { clearRoles } = roleSlice.actions;
export default roleSlice.reducer;
