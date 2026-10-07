import { getAllRoles } from "@/apis/roles";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllRolesAction = createAsyncThunk(
  "roles/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getAllRoles();
      return data?.responseObject ?? data?.data ?? data;
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to load roles");
    }
  }
);
