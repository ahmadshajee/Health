export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'doctor' | 'patient';
  createdAt: string;
  updatedAt?: string;
}

export interface Doctor extends User {
  role: 'doctor';
  specialization?: string;
  contactNumber?: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth?: string;
  contactNumber?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'doctor' | 'patient';
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}
