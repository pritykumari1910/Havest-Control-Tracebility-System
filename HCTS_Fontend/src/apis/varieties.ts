import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllVarieties = async () => {
    try {
        const response = await axiosInstance.get('/varieties');
        return response.data; 
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching varieties');
    } 
}

export const createVariety = async (varietyData: any) => {
    try {
        const response = await axiosInstance.post('/varieties', varietyData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the variety');
    }
}

export const updateVariety = async (varietyId: string, varietyData: any) => {
    try {
        const response = await axiosInstance.patch(`/varieties/${varietyId}`, varietyData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the variety');
    }
}

export const getAllPlotVarieties = async () => {
    try {
        const response = await axiosInstance.get('/plot-varieties');
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching plot assignments');
    }
}

export const createPlotVariety = async (data: any) => {
    try {
        const response = await axiosInstance.post('/plot-varieties', data);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the plot assignment');
    }
}

export const deletePlotVariety = async (id: string) => {
    try {
        const response = await axiosInstance.delete(`/plot-varieties/${id}`);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while deleting the plot assignment');
    }
}