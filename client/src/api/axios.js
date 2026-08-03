import axios from 'axios';
import { API_URL } from '../config/api.js';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add other default headers here if needed
  },
  withCredentials: true,
});

export default axiosInstance;
