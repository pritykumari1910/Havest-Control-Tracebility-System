import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getMachine = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/machines", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const createMachine = async (data: any) => {
    try {
        const response = await axiosInstance.post("/machines", data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const updateMachine = async (id: string, data: any) => {
    try {
        const response = await axiosInstance.patch(`/machines/${id}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const toggleMachineStatus = async (id: string) => {
    try {
        const response = await axiosInstance.patch(`/machines/${id}/toggle-status`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

// ---- Standing machine ↔ operator assignments ----

export const getMachineOperators = async (machineId: string) => {
    try {
        const response = await axiosInstance.get(`/machines/${machineId}/operators`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const assignWorkersToMachine = async (machineId: string, workerIds: string[]) => {
    try {
        const response = await axiosInstance.post(`/machines/${machineId}/operators`, { workerIds });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const removeWorkerFromMachine = async (machineId: string, workerId: string) => {
    try {
        const response = await axiosInstance.delete(`/machines/${machineId}/operators/${workerId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};
