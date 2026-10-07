import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAllUsers } from "@/apis/users";

export const getAllUsersAction = createAsyncThunk(
  "users/getAll",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      roleId?: string;
      roleName?: string;
      isActive?: string;
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const data = await getAllUsers(params);
      const users = data?.responseObject?.users ?? data?.responseObject ?? data?.data ?? data;
      const pagination = data?.responseObject?.pagination ?? null;
      return { users, pagination };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to load users");
    }
  },
);
