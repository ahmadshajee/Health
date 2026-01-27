export interface Prescription {
  id: string;
  doctorId: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  notes?: string;
  qrCode: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePrescriptionData {
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  notes?: string;
}

export interface UpdatePrescriptionData {
  medication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  notes?: string;
  status?: 'active' | 'completed' | 'cancelled';
}
