import { axiosInstance } from "@/utils/axios/axiosInstance";

export const  registerBuyer = async (data: any) => {
    try {
        const response = await axiosInstance.post("/logistics/buyers", data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const  updateBuyer = async (id: string, data: any) => {
    try {
        const response = await axiosInstance.put(`/logistics/buyers/${id}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }            
};  

export const  getAllBuyers = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/logistics/buyers", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const registerDestinationCenter = async (data: any) => {
    try {
        const response = await axiosInstance.post("/logistics/destinations", data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const updateDestinationCenter = async (id: string, data: any) => {
    try {
        const response = await axiosInstance.put(`/logistics/destinations/${id}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }            
};  

export const getAllDestinationCenters = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/logistics/destinations", { params });        
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};      

export const registerTransporter = async (data: any) => {
    try {
        const response = await axiosInstance.post("/logistics/transport-providers", data);
        return response.data;
    }   catch (error: any) {        
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const updateTransporter = async (id: string, data: any) => {
    try {
        const response = await axiosInstance.put(`/logistics/transport-providers/${id}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }            
};  

export const getAllTransporters = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/logistics/transport-providers", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};  