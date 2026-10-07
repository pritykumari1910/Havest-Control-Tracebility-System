import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllCompanies = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/employment-companies', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching companies');
    }
}

export const createCompany = async (companyData: any) => {
    try {
        const response = await axiosInstance.post('/employment-companies', companyData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the company');
    }
}

export const updateCompany = async (companyId: string, companyData: any) => {
    try {
        const response = await axiosInstance.patch(`/employment-companies/${companyId}`, companyData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the company');
    }
}


export const getAllWorkers = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/workers', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching workers');
    }
}

export const createWorker = async (workerData: any) => {
    try {
        const response = await axiosInstance.post('/workers', workerData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the worker');
    }
}

export const updateWorker = async (workerId: string, workerData: any) => {
    try {
        const response = await axiosInstance.patch(`/workers/${workerId}`, workerData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the worker');
    }
}   

export const downloadQRForWorker = async (workerId: string) => {
    try {
        const response = await axiosInstance.get(`/workers/${workerId}/qr/download`, { responseType: 'blob' });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while downloading the QR code for the worker');
    }
}


export const downloadQRPDFBooklet = async () => {
    try {
        const response = await axiosInstance.get(`/workers/qr/booklet`, { responseType: 'blob' });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while downloading the QR code booklet for the workers');
    }
}

export const getSatelliteWorkers = async () => {
    try {
        const response = await axiosInstance.get('/satellite-roles',);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching satellite workers');
    }
}

export const createSatelliteWorker = async (workerData: any) => {
    try {
        const response = await axiosInstance.post('/satellite-roles', workerData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the satellite worker');
    }
}

export const updateSatelliteWorker = async (workerId: string, workerData: any) => {
    try {
        const response = await axiosInstance.patch(`/satellite-roles/${workerId}`, workerData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the satellite worker');
    }
}       