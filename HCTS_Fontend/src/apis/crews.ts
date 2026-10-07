import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllCrews = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/crews", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const createCrew = async (data: any) => {
    try {
        const response = await axiosInstance.post("/crews", data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const updateCrew = async (id: string, data: any) => {
    try {
        const response = await axiosInstance.patch(`/crews/${id}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const toggleCrewStatus = async (id: string) => {
    try {
        const response = await axiosInstance.patch(`/crews/${id}/toggle-status`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const copyPreviousCrews = async (data?: { workDate?: string }) => {
    try {
        const response = await axiosInstance.post("/crews/copy-previous", data ?? {});
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const getAttendanceByCrewId = async (crewId: string) => {
    try {
        const response = await axiosInstance.get(`/crews/${crewId}/attendance`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const checkInAttendance = async (crewId: string, data: { workerIds: string[]; entryTime?: string }) => {
    try {
        const response = await axiosInstance.post(`/crews/${crewId}/attendance/check-in`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const checkOutAttendance = async (crewId: string, data: { workerIds: string[]; exitTime?: string }) => {
    try {
        const response = await axiosInstance.post(`/crews/${crewId}/attendance/check-out`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};
