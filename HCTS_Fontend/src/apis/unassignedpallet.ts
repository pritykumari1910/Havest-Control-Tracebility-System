import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getUnassignedPallets = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/unassigned-bin-queue", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

// Backend requires a body: { harvestAssignmentId, note? }
export  const resolvedUnasignedPallets= async (queueItemId: any, data?: Record<string, any>) => {
    try {
        const response = await axiosInstance.patch(`/unassigned-bin-queue/${queueItemId}/resolve`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}

// Backend requires a body: { reason }
export const rejectUnassignedPallets= async (queueItemId: any, data?: Record<string, any>) => {
    try {
        const response = await axiosInstance.patch(`/unassigned-bin-queue/${queueItemId}/reject`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}