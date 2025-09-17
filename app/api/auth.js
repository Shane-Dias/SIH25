import axios from 'axios';

// Centralized API base URL from .env
export const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.1.37:8000';

export const signup = async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/api/signup/`, userData);
    return response.data;
};

export const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/login/`, { email, password });
    return response.data;
};
