import { axiosInstance } from "@/utils/axios/axiosInstance";

export const getAllRoles = async () => {
  try {
    const response = await axiosInstance.get('access/roles');
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred while fetching roles');
  } 
} 

export const getAllPermissions = async () => {
  try {
    const response = await axiosInstance.get('access/permissions');
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred while fetching permissions');
  } 
}

export const updateRolePermissions = async (roleId: string, permissions: string[]) => {
  try {
    const response = await axiosInstance.patch(`access/roles/${roleId}`, { permissions });
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred while updating role permissions');
  } 
} 