import { axiosInstance } from "@/utils/axios/axiosInstance";


       
export const getAllReceptonsBatchList = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/reception/batches", { params });        
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};


export const getAllPalletsForReception = async (batchId: string, params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get(`/reception/batches/${batchId}/scans`, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const updateReceptionPallets = async (batchId: string, data: any) => {
    try {
        const response = await axiosInstance.patch(`/reception/batches/${batchId}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}