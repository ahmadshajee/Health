import axios from 'axios';
import { LoginCredentials, RegisterData, User } from '../types/auth';

// Base API URL - Use backend URL directly for GitHub Pages deployment
const API_URL = window.location.hostname === 'localhost'
  ? '/api'  // Development - uses proxy
  : 'https://health-8zum.onrender.com/api';  // Production - full URL

// Log API URL for debugging
console.log('API Base URL:', API_URL);

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
  console.log('Making request to:', `${config.baseURL || ''}${config.url || ''}`);
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth service functions
export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string }>('/auth/login', credentials);
  return response.data;
};

export const register = async (data: RegisterData): Promise<{ user: User }> => {
  const response = await api.post<{ user: User }>('/auth/register', data);
  return response.data;
};

export const googleLogin = async (credential: string, role: string = 'patient'): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string; isNewUser: boolean }>('/auth/google', { credential, role });
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
