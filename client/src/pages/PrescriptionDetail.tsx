import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPrescriptionById, updatePrescription } from '../services/prescriptions';
import { getPatientById } from '../services/patients';
import { findUserById } from '../utils/auth';
import { Prescription } from '../types/prescription';
import { Doctor, Patient } from '../types/auth';
import { 
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Grid,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import QRCode from 'qrcode.react';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import DoneIcon from '@mui/icons-material/Done';

const PrescriptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPrescriptionDetails = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        
        // Fetch prescription
        const prescriptionData = await getPrescriptionById(id);
        setPrescription(prescriptionData);
        
        // Fetch patient data
        const patientData = await getPatientById(prescriptionData.patientId);
        setPatient(patientData);
        
        // For now, we'll use a utility to get doctor data from localStorage
        // In a real app, you'd make an API call
        const doctorData = findUserById(prescriptionData.doctorId);
        setDoctor(doctorData as Doctor);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching prescription details:', err);
        setError('Failed to load prescription details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescriptionDetails();
  }, [id]);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    // Create a link to download the prescription as a PDF or image
    // For simplicity, we'll just print it now
    window.print();
  };
  
  const handleMarkComplete = async () => {
    try {
      if (!prescription || !id) return;
      
      const updatedPrescription = await updatePrescription(id, {
        status: 'completed'
      });
      
      setPrescription(updatedPrescription);
    } catch (err) {
      console.error('Error updating prescription status:', err);
      setError('Failed to update prescription status');
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !prescription) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Prescription not found'}</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  const isDoctor = user?.role === 'doctor';
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Prescription
          </Typography>
          
          <Chip 
            label={prescription.status.toUpperCase()} 
            color={prescription.status === 'active' ? 'primary' : 'success'}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={8}>
            <Typography variant="h6" gutterBottom>
              Prescription Details
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Medication:</strong> {prescription.medication}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Dosage:</strong> {prescription.dosage}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Frequency:</strong> {prescription.frequency}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Duration:</strong> {prescription.duration}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Instructions:</strong> {prescription.instructions}
              </Typography>
              {prescription.notes && (
                <Typography variant="body1" gutterBottom>
                  <strong>Notes:</strong> {prescription.notes}
                </Typography>
              )}
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Created:</strong> {new Date(prescription.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Doctor:</strong>
                </Typography>
                {doctor ? (
                  <>
                    <Typography variant="body2">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </Typography>
                    {doctor.specialization && (
                      <Typography variant="body2" color="textSecondary">
                        {doctor.specialization}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Doctor information not available
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Patient:</strong>
                </Typography>
                {patient ? (
                  <>
                    <Typography variant="body2">
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    {patient.dateOfBirth && (
                      <Typography variant="body2" color="textSecondary">
                        DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Patient information not available
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Verification QR Code
              </Typography>
              
              <Box 
                sx={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 1, 
                  p: 2, 
                  backgroundColor: '#fff',
                  mt: 1
                }}
              >
                <QRCode value={prescription.id} size={150} />
              </Box>
              
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
                Scan to verify authenticity
              </Typography>
              
              <Box sx={{ mt: 3, width: '100%' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ mb: 1 }}
                >
                  Print
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  sx={{ mb: 1 }}
                >
                  Download
                </Button>
                
                {isDoctor && prescription.status === 'active' && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<DoneIcon />}
                    onClick={handleMarkComplete}
                  >
                    Mark as Completed
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrescriptionDetail;
