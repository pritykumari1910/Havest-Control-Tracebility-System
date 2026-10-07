import { axiosInstance, getStoredToken } from "@/utils/axios/axiosInstance";

export const signin = async (data: any) => {
  try {
    data.userportal = "web";
    const response = await axiosInstance.post('/user/login', data);

   localStorage.setItem('accesstoken', JSON.stringify(response?.data?.responseObject?.tokens?.accessToken));
  localStorage.setItem('refreshtoken', JSON.stringify(response?.data?.responseObject?.tokens?.refreshToken));

    return response.data.responseObject; 
  } catch (error: any) {
   console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during signin');
  }
};
export const forgotPassword = async (data: any) => {
  try {
    data.userportal = "web";
    const response = await axiosInstance.post('user/forgot-password', data);
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during password reset request');
  }
}

export const resetPassword = async (data: any) => {
  try {
    data.userportal = "web";
    const response = await axiosInstance.post('user/reset-password', data);
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during password reset');
  }
};  


export const signOut = async () => {
  try {
    // attempt server-side logout if endpoint exists
    try { await axiosInstance.post("user/logout"); } catch (e) { /* ignore */ }
  } finally {
    localStorage.removeItem('accesstoken');
    localStorage.removeItem('refreshtoken');
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hcts-auth-changed"));
    }
  }
};

export const refreshToken = async () => {
  try {
    const token = getStoredToken('refreshtoken');
    if (!token) {
      throw new Error('No refresh token found');
    }

    const response = await axiosInstance.post('/user/refresh-token', { refreshToken: token });
    const tokens = response?.data?.responseObject?.tokens;
    if (tokens?.accessToken) {
      localStorage.setItem('accesstoken', JSON.stringify(tokens.accessToken));
    }
    if (tokens?.refreshToken) {
      localStorage.setItem('refreshtoken', JSON.stringify(tokens.refreshToken));
    }
    return response.data.responseObject;
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during token refresh');
  }
}


export const updatePassword = async (data: any) => {
  try {
    const response = await axiosInstance.post('user/change-password', data);
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during password change');
  }
}

export const updateProfile = async (data: any) => {
  try {
    const response = await axiosInstance.put('user/me', data);
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred during profile update');
  }
}

export const getProfile = async ()=>{

  try {
    const response = await axiosInstance.get('user/me');
    return response.data; 
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'An error occurred while fetching profile');
  } 
}