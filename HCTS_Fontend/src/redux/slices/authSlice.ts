import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {  getProfileAction, loginAction } from "../actions/authActions";
// import { get_user_profile } from "../actions/userAction";
import type { InitialState, User } from "@/utils/interface";
import { normalizeUserRoles } from "@/lib/roles";


interface AuthInitialState extends InitialState{
    sign_in_mail:string
    userInfo: User |null
    isAuthenticated: boolean
    activeRole: string | null
}

const initial_state :AuthInitialState={
    isError:false,
    isLoading:false,
    isSuccess:false,
    sign_in_mail:"",
    userInfo:null,
    isAuthenticated: false,
    activeRole: null,
}

// When a user has exactly one role, pre-select it so we never prompt them.
// With multiple roles we leave activeRole null so the role-selection modal shows.
const deriveActiveRole = (user: any): string | null => {
    const roles = normalizeUserRoles(user);
    return roles.length === 1 ? roles[0] : null;
};

const create_auth_slice = createSlice({
    name:'auth',
    initialState:initial_state,
    reducers:{
        set_signin_mail:(state, action: PayloadAction<string>)=>{
            state.sign_in_mail = action.payload
        },
        set_active_role:(state, action: PayloadAction<string | null|any>)=>{
            state.activeRole = action.payload
        },
        clear_user_info:()=>{
            return initial_state
        }
    },
    extraReducers:(builder)=>{
       builder
        .addCase(loginAction.pending, (state) => {
          state.isLoading = true;
          state.isError = false;
          state.isSuccess = false;
        })
        .addCase(loginAction.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.isError = false;
          state.isAuthenticated = true;
          state.userInfo = action?.payload?.user ?? null;
          state.activeRole = deriveActiveRole(action?.payload?.user);
        })
        .addCase(loginAction.rejected, (state) => {
          state.isLoading = false;
          state.isError = true;
          state.isSuccess = false;
          state.isAuthenticated = false;
          state.userInfo = null;
        })
        .addCase(getProfileAction.fulfilled, (state, action) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.isError = false;
          state.isAuthenticated = true;
          state.userInfo = action?.payload?.user ?? null;
          // Preserve an already-chosen role across profile refreshes; only
          // (re)derive when nothing is selected yet.
          if (!state.activeRole) {
            state.activeRole = deriveActiveRole(action?.payload?.user);
          }
        })
          
      
    }
})
export const { set_signin_mail , set_active_role , clear_user_info } = create_auth_slice.actions
export default create_auth_slice.reducer
