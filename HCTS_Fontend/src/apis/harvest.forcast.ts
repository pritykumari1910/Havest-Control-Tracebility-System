import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getHarvestForecast = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/harvest-forecast", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const createHarvestForecast = async (data: any) => {
    try {
        const response = await axiosInstance.post("/harvest-forecast", data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const updateHarvestForecast = async (id: string, data: any) => {
    try {
        const response = await axiosInstance.put(`/harvest-forecast/${id}`, data);          
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
};

export const bulkuploadHarvestForecast = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axiosInstance.post("/harvest-forecast/bulk-upload", formData);
        return response.data;
    } catch (error: any) {
        // Surface per-row validation errors when the backend returns them.
        const data = error.response?.data;
        const err: any = new Error(data?.message || "An error occurred");
        if (Array.isArray(data?.responseObject?.errors)) {
            err.rowErrors = data.responseObject.errors as string[];
        }
        throw err;
    }
}