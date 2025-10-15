import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // Change port if needed
  headers: {
    'Content-Type': 'application/json',
    // Add other default headers here if needed
  },
  withCredentials: true,
});

export default axiosInstance;