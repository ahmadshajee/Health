import api from './api';
import { Doctor } from '../types/auth';

// Doctor service functions
export const getDoctors = async (): Promise<Doctor[]> => {
  const response = await api.get<Doctor[]>('/doctors');
  return response.data;
};

export const updateDoctorProfile = async (data: Partial<Doctor>): Promise<Doctor> => {
  const response = await api.put<Doctor>('/doctors/profile', data);
  return response.data;
};
