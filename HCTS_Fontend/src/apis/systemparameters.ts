import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllSystemParameters = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/system-parameters", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }            
}   

export const createSystemParameter = async (data: any) => {
    try {
        const response = await axiosInstance.post("/system-parameters", data);
        return response.data;
    }               
    catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const updateSystemParameter = async (id: string, data: any) => {
    try {
        const response = await axiosInstance.patch(`/system-parameters/${id}`, data);          
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};  