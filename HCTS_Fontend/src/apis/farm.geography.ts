import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllFarms = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/farms', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching farms');
    }
}

export const createFarm = async (farmData: any) => {
    try {
        const response = await axiosInstance.post('/farms', farmData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the farm');
    }
}
    
export const updateFarm = async (farmId: string, farmData: any) => {
    try {
        const response = await axiosInstance.patch(`/farms/${farmId}`, farmData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the farm');
    }
}

export const getAllPlots = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/plots', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching plots');
    }
}

export const createPlot = async (plotData: any) => {
    try {
        const response = await axiosInstance.post('/plots', plotData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the plot');
    }
}

export const updatePlot = async (plotId: string, plotData: any) => {
    try {
        const response = await axiosInstance.patch(`/plots/${plotId}`, plotData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the plot');
    }
}

export const getAllValves = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/valves', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching valves');
    }
}

export const createValve = async (valveData: any) => {
    try {
        const response = await axiosInstance.post('/valves', valveData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the valve');
    }
}

export const updateValve = async (valveId: string, valveData: any) => {
    try {
        const response = await axiosInstance.patch(`/valves/${valveId}`, valveData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the valve');
    }
}

export const getAllParks = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/parks', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching parks');
    }
}

export const createPark = async (parkData: any) => {
    try {
        const response = await axiosInstance.post('/parks', parkData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the park');
    }
}

export const updatePark = async (parkId: string, parkData: any) => {
    try {
        const response = await axiosInstance.patch(`/parks/${parkId}`, parkData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the park');
    }
}


export const allPlotsOfFarm = async (farmId: string) => {
    try {
        const response = await axiosInstance.get(`/plots/farm/${farmId}`, { params: { limit: 100 } });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching plots of the farm');
    }
}


export const allValvesOfPlot = async (plotId: string) => {
    try {
        const response = await axiosInstance.get(`/valves/plot/${plotId}`, { params: { limit: 100 } });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching valves of the plot');
    }
}


export const allParksOfValve = async (valveId: string) => {
    try {
        const response = await axiosInstance.get(`/parks/valve/${valveId}`);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching parks of the valve');
    }
}       