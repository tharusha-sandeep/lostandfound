import axiosClient from './axiosClient';

export const registerUser = async (data) => {
  const response = await axiosClient.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await axiosClient.post('/auth/login', data);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axiosClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password, confirmPassword) => {
  const response = await axiosClient.post(`/auth/reset-password/${token}`, {
    password,
    confirmPassword,
  });
  return response.data;
};

export const resendVerification = async (email) => {
  const response = await axiosClient.post('/auth/resend-verification', { email });
  return response.data;
};