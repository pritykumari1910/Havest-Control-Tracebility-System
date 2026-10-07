import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getDashboardDataAction, type DashboardSummary } from "@/redux/actions/dashboardActions";
import type { InitialState } from "@/utils/interface";

interface DashboardState extends InitialState {
  summary: DashboardSummary | null;
  errorMessage: string | null;
  // Metadata about the last real-time refresh trigger received over the socket.
  lastEvent: { entity: string; action: string; timestamp: string } | null;
}

const initialState: DashboardState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  summary: null,
  errorMessage: null,
  lastEvent: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    // Record the socket-driven refresh signal (the actual data is re-fetched via the thunk).
    dashboardEventReceived(
      state,
      action: PayloadAction<{ entity: string; action: string; timestamp: string }>,
    ) {
      state.lastEvent = action.payload;
    },
    clearDashboard(state) {
      state.summary = null;
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = null;
      state.lastEvent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardDataAction.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.errorMessage = null;
      })
      .addCase(getDashboardDataAction.fulfilled, (state, action: PayloadAction<DashboardSummary>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.summary = action.payload;
      })
      .addCase(getDashboardDataAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload as string) || action.error.message || "Failed to load dashboard data";
      });
  },
});

export const { dashboardEventReceived, clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
