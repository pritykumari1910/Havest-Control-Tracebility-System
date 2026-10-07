import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getAllUsersAction } from "@/redux/actions/userActions";
import type { InitialState, User, Paginate } from "@/utils/interface";

interface UserState extends InitialState {
  users: User[];
  pagination: Paginate | null;
  errorMessage: string | null;
}

const initialState: UserState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  users: [],
  pagination: null,
  errorMessage: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsers(state) {
      state.users = [];
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllUsersAction.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.errorMessage = null;
      })
      .addCase(
        getAllUsersAction.fulfilled,
        (state, action: PayloadAction<{ users: User[]; pagination: Paginate | null }>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.users = action.payload.users;
          state.pagination = action.payload.pagination;
        },
      )
      .addCase(getAllUsersAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload as string || action.error.message || "Failed to fetch users";
      });
  },
});

export const { clearUsers } = userSlice.actions;
export default userSlice.reducer;
