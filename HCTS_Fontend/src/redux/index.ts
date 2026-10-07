import { combineReducers } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import userReducer from "./slices/userSlice"
import roleReducer from "./slices/roleSlice"
import dashboardReducer from "./slices/dashboardSlice"

const rootReducer = combineReducers({
  auth: authReducer,
  users: userReducer,
  roles: roleReducer,
  dashboard: dashboardReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export type { AppDispatch } from "./store";
export default rootReducer