import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllDispatchNotes = async (params?: Record<string, any>) => {    
    try {
        const response = await axiosInstance.get("/logistics/dispatch-notes", { params });
        return response.data;
    }        
    catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }               
}   

export const updateDispatchNote = async (noteId: string, data: Record<string, any>) => {
    try {
        const response = await axiosInstance.put(`/logistics/dispatch-notes/${noteId}`, data);
        return response.data;
    }        
    catch (error: any) {
        throw new Error(error.response?.data?.message || "An error occurred");
    }               
}   