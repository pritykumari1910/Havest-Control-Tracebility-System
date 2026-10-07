import { axiosInstance } from "@/utils/axios/axiosInstance";


export const getDashboardData = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/dashboard", { params });
        return response.data;
    }        
    catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}