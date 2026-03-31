import axios from 'axios';
import toast from 'react-hot-toast';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const mockRole = localStorage.getItem('mockRole') || 'student';
    if (import.meta.env.DEV) {
      config.headers['x-mock-role'] = mockRole;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      toast.error('Cannot connect to server.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    if (status === 400) {
      const msg = data?.errors ? (data.errors[0]?.message || data.errors[0]) : data?.message || 'Bad Request';
      toast.error(msg);
    } else if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('mockRole');
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error('You are not authorised to perform this action');
    } else if (status === 404) {
      // Components handle their own not-found states
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
