import axios from 'axios';

// Use Render backend in production, localhost in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://health-8zum.onrender.com/api'
  : 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get current user
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user data' };
    }
  },

  // Google OAuth login
  googleLogin: async (credential, role = 'patient') => {
    try {
      const response = await api.post('/auth/google', { credential, role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Google login failed' };
    }
  },
};

// Prescriptions API
export const prescriptionsAPI = {
  // Get all prescriptions for current user
  getMyPrescriptions: async () => {
    try {
      const response = await api.get('/prescriptions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch prescriptions' };
    }
  },

  // Create new prescription (doctors only)
  createPrescription: async (prescriptionData) => {
    try {
      const response = await api.post('/prescriptions', prescriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create prescription' };
    }
  },

  // Get prescription by ID
  getPrescriptionById: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch prescription' };
    }
  },

  // Update prescription (doctors only)
  updatePrescription: async (id, prescriptionData) => {
    try {
      const response = await api.put(`/prescriptions/${id}`, prescriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update prescription' };
    }
  },

  // Delete prescription (doctors only)
  deletePrescription: async (id) => {
    try {
      const response = await api.delete(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete prescription' };
    }
  },

  // Download prescription as PDF
  downloadPrescription: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}/download`, {
        responseType: 'blob', // Important for file downloads
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `prescription-${id}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Download started' };
    } catch (error) {
      throw error.response?.data || { message: 'Failed to download prescription' };
    }
  },
};

// Users API
export const usersAPI = {
  // Get all patients (doctors only) - DEPRECATED for security, use getMyPatients instead
  getPatients: async () => {
    try {
      const response = await api.get('/users/patients');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch patients' };
    }
  },

  // Get only patients that the doctor has prescribed to (secure)
  getMyPatients: async () => {
    try {
      const response = await api.get('/users/patients/my-patients');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch my patients' };
    }
  },

  // Look up a patient by their ID (for adding existing patients)
  lookupPatientById: async (patientId) => {
    try {
      const response = await api.get(`/users/patients/lookup/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to find patient' };
    }
  },

  // Link a patient to the doctor (persist the relationship)
  linkPatient: async (patientId) => {
    try {
      const response = await api.post(`/users/patients/link/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to link patient' };
    }
  },

  // Create new patient (doctors only)
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/users/patients/create', patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create patient' };
    }
  },

  // Get all doctors
  getDoctors: async () => {
    try {
      const response = await api.get('/users/doctors');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch doctors' };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/users/password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },
};

export default api;
