import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllAudits = async (
  params: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string } = {},
) => {
  try {
    const response = await axiosInstance.get('/audit-logs', {
      params,
    });
    return response.data?.responseObject ?? response.data;
  } catch (error: any) {
    console.log(error);
    throw new Error(
      error.response?.data?.message || 'An error occurred while fetching all audits',
    );
  }
};

export const harvestProgress= async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/reports/harvest-progress", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}       

export const exportHarvestProgress = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/reports/harvest-progress/export", { params, responseType: "blob" });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}   

export const  palletTraceability = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/reports/harvest-receipt-scans", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}

export const dispatchNotesReport = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/reports/dispatch-notes", { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
}

export const exportDispatchNotesReport = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get("/reports/dispatch-notes/export", { params, responseType: "blob" });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }
} 