import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllUsers = async (params: { page?: number; limit?: number; search?: string } = {}) => {
  try {
    const response = await axiosInstance.get('user/all-users', {
      params,
    });
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw new Error(
      error.response?.data?.message || 'An error occurred while fetching all users',
    );
  }
};

export const addUser = async (data: any) => {
  try {
    const response = await axiosInstance.post('user/register', data);
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during user creation');
  }
};

export const updateUser = async (userId: string, data: any) => {
  try {
    const response = await axiosInstance.put(`user/${userId}`, data);
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during user update');
  }
};

export const activateUser = async (userId: string) => {
  try {
    const response = await axiosInstance.patch(`user/${userId}/activate`);
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during user activation');
  }
};

export const deactivateUser = async (userId: string) => {
  try {
    const response = await axiosInstance.patch(`user/${userId}/deactivate`);
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during user deactivation');
  }
};