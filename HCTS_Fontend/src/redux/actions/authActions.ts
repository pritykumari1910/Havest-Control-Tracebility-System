import { getProfile, signin, } from "@/apis/auth";
import { axiosInstance } from "@/utils/axios/axiosInstance";
import { json_config } from "@/utils/headers_config";
import type { Auth } from "@/utils/interface";
import { createAsyncThunk } from "@reduxjs/toolkit";


    export const loginAction = createAsyncThunk(
    "user/login", async(payload:Pick<Auth, "email" | "password">,{rejectWithValue})=>{
        try {
            const data = await signin(payload)
            return data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const getProfileAction = createAsyncThunk(
    "user/profile", async(_, {rejectWithValue})=>{
        try {
            const  data  = await getProfile()
            const user = data?.responseObject?.user ?? data?.responseObject ?? data?.data ?? data;
            return { user }
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const resend_otp = createAsyncThunk(
    "resend/otp",async(email:string,{rejectWithValue})=>{
        try {
            
            const { data } = await axiosInstance.post(`/auth/resend-otp`,{email:email},json_config)
            return data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)







  
            
        