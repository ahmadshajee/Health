import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { usersAPI, prescriptionsAPI } from '../../services/api';

const PrescriptionForm = ({ onCreatePrescription }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  const [prescription, setPrescription] = useState({
    patientId: '',
    patientEmail: '',
    diagnosis: '',
    medications: [
      { name: '', dosage: '', frequency: '', duration: '' }
    ],
    instructions: '',
    followUpDate: ''
  });

  // Fetch patients when component mounts
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoadingPatients(true);
        setError(''); // Clear any previous errors
        console.log('Fetching patients...');
        const response = await usersAPI.getPatients();
        console.log('Patients response:', response);
        console.log('Patients array:', response.patients);
        
        if (response.patients && response.patients.length > 0) {
          setPatientsList(response.patients);
          console.log('Successfully loaded', response.patients.length, 'patients');
        } else {
          console.log('No patients found in response');
          setPatientsList([]);
          setError('No patients available. Please ensure patients are registered in the system.');
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        console.error('Error details:', error.response?.data || error.message);
        setError(`Failed to load patients list: ${error.response?.data?.message || error.message}`);
        setPatientsList([]);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);
  
  const handleChange = (e) => {
    setPrescription({
      ...prescription,
      [e.target.name]: e.target.value
    });
  };
  
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...prescription.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    
    setPrescription({
      ...prescription,
      medications: updatedMedications
    });
  };
  
  const addMedication = () => {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        { name: '', dosage: '', frequency: '', duration: '' }
      ]
    });
  };
  
  const removeMedication = (index) => {
    if (prescription.medications.length === 1) {
      return; // Keep at least one medication field
    }
    
    const updatedMedications = prescription.medications.filter((_, i) => i !== index);
    setPrescription({
      ...prescription,
      medications: updatedMedications
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    // Validate form
  if (!(prescription.patientId || prescription.patientEmail) || !prescription.diagnosis || 
        prescription.medications.some(med => !med.name || !med.dosage)) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      // Create prescription via API
      const response = await prescriptionsAPI.createPrescription(prescription);
      
      setLoading(false);
      setSuccess(true);
      
      if (onCreatePrescription) {
        onCreatePrescription(response.prescription);
      }
      
      // Reset form after successful submission
      setPrescription({
        patientId: '',
        patientEmail: '',
        diagnosis: '',
        medications: [
          { name: '', dosage: '', frequency: '', duration: '' }
        ],
        instructions: '',
        followUpDate: ''
      });
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Failed to create prescription');
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Create New Prescription
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Prescription created successfully! A QR code and email have been sent to the patient.
        </Alert>
      )}
      
      {loadingPatients && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading patients...</Typography>
        </Box>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel id="patient-label">Select Patient</InputLabel>
              <Select
                fullWidth
                labelId="patient-label"
                id="patient"
                name="patientId"
                value={prescription.patientId}
                onChange={(e) => {
                  const selected = patientsList.find(p => p.id === e.target.value);
                  setPrescription({
                    ...prescription,
                    patientId: e.target.value,
                    patientEmail: selected?.email || ''
                  });
                }}
              >
                {patientsList.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Diagnosis"
              name="diagnosis"
              multiline
              rows={2}
              value={prescription.diagnosis}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Medications
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {prescription.medications.map((medication, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Medication Name"
                      value={medication.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Dosage"
                      value={medication.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Frequency"
                      value={medication.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      placeholder="e.g., Twice daily"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      label="Duration"
                      value={medication.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={1}>
                    <IconButton 
                      color="error" 
                      onClick={() => removeMedication(index)}
                      aria-label="remove medication"
                      disabled={prescription.medications.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addMedication}
              variant="outlined"
              sx={{ mt: 1 }}
            >
              Add Medication
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Special Instructions"
              name="instructions"
              multiline
              rows={3}
              value={prescription.instructions}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Follow-up Date"
              name="followUpDate"
              type="date"
              value={prescription.followUpDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<QrCodeIcon />}
            disabled={loading || loadingPatients}
            sx={{ minWidth: 200 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Prescription'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PrescriptionForm;
