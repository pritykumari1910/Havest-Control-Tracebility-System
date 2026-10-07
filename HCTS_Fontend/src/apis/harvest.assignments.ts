import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllAssignments = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/harvest-assignments", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }    
}

export const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
        const response = await axiosInstance.patch(`/harvest-assignments/${assignmentId}/status`, { status });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}

export const updateAssignment = async (assignmentId: string, data: Record<string, any>) => {
    try {
        const response = await axiosInstance.put(`/harvest-assignments/${assignmentId}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}
