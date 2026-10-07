import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllSeries = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/qr-series', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching QR series');
    }
}

export const generateSeries = async (seriesData: any) => {
    try {
        const response = await axiosInstance.post('/qr-series', seriesData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while generating QR series');
    }
}

export const updateSeries = async (
    seriesId: string,
    data: { seriesName?: string; comments?: string },
) => {
    try {
        const response = await axiosInstance.patch(`/qr-series/${seriesId}`, data);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the QR series');
    }
}

export const updatePrinterOrder = async (seriesId: string, data: any) => {
    try {
        const response = await axiosInstance.put(`/qr-series/${seriesId}/printer-order`, data);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the printer order');
    }
}

export const registerReceipt = async (seriesId: string, data: any) => {
    try {
        const response = await axiosInstance.put(`/qr-series/${seriesId}/receipt`, data);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while registering the receipt');
    }
}

export const activateSeries = async (seriesId: string) => {
    try {
        const response = await axiosInstance.patch(`/qr-series/${seriesId}/activate`);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while activating QR series');
    }
}

export const cancelSeries = async (seriesId: string) => {
    try {
        const response = await axiosInstance.patch(`/qr-series/${seriesId}/cancel`);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while cancelling QR series');
    }
}

export const exportSeries = async (seriesId: string, format: "csv" | "pdf" | "zip") => {
    try {
        const response = await axiosInstance.get(`/qr-series/${seriesId}/export/${format}`, {
            responseType: "blob",
        });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || `An error occurred while exporting the QR series as ${format.toUpperCase()}`);
    }
}

// ---- QR Inventory Status Dashboard ----

export const getInventory = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/qr-series/dashboard/inventory', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching the QR inventory');
    }
}

export const getSeriesSummary = async (seriesId: string) => {
    try {
        const response = await axiosInstance.get(`/qr-series/${seriesId}/dashboard/summary`);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching the series summary');
    }
}
