import axios from 'axios';
import { LoginCredentials, RegisterData, User } from '../types/auth';

// Base API URL
const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Auth service functions
export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string }>('/auth/login', credentials);
  return response.data;
};

export const register = async (data: RegisterData): Promise<{ user: User }> => {
  const response = await api.post<{ user: User }>('/auth/register', data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const role = JSON.parse(localStorage.getItem('user') || '{}')?.role;
  let endpoint = '';
  
  if (role === 'doctor') {
    endpoint = '/doctors/profile';
  } else if (role === 'patient') {
    endpoint = '/patients/profile';
  } else {
    throw new Error('Invalid user role');
  }
  
  const response = await api.get<User>(endpoint);
  return response.data;
};

export default api;
