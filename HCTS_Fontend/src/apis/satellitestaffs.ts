import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllSatelliteStaffs = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/satellite-staff", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const updateSatelliteStaff = async (id: string, data: any) => {
    try {
        const response = await axiosInstance.patch(`/satellite-staff/${id}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};  
