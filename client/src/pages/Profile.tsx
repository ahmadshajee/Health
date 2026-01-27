import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { updateDoctorProfile } from '../services/doctors';
import { updatePatientProfile } from '../services/patients';
import { Doctor, Patient } from '../types/auth';

const Profile = () => {
  const { authState } = useAuth();
  const { user } = authState;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [doctorFormData, setDoctorFormData] = useState<Partial<Doctor>>({
    firstName: '',
    lastName: '',
    specialization: '',
    contactNumber: ''
  });
  
  const [patientFormData, setPatientFormData] = useState<Partial<Patient>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    contactNumber: '',
    address: ''
  });
  
  // Set initial form data based on user role
  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'doctor') {
      setDoctorFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        specialization: (user as Doctor).specialization || '',
        contactNumber: (user as Doctor).contactNumber || ''
      });
    } else if (user.role === 'patient') {
      setPatientFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dateOfBirth: (user as Patient).dateOfBirth || '',
        contactNumber: (user as Patient).contactNumber || '',
        address: (user as Patient).address || ''
      });
    }
  }, [user]);
  
  // Handle doctor form input changes
  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDoctorFormData({
      ...doctorFormData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle patient form input changes
  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientFormData({
      ...patientFormData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      if (user?.role === 'doctor') {
        await updateDoctorProfile(doctorFormData);
      } else if (user?.role === 'patient') {
        await updatePatientProfile(patientFormData);
      }
      
      setSuccess(true);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">User not found</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user.email}
          </Typography>
          <Typography variant="body1">
            <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h6" gutterBottom>
          Edit Profile
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {user.role === 'doctor' ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={doctorFormData.firstName}
                  onChange={handleDoctorChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={doctorFormData.lastName}
                  onChange={handleDoctorChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Specialization"
                  name="specialization"
                  value={doctorFormData.specialization}
                  onChange={handleDoctorChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contactNumber"
                  value={doctorFormData.contactNumber}
                  onChange={handleDoctorChange}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={patientFormData.firstName}
                  onChange={handlePatientChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={patientFormData.lastName}
                  onChange={handlePatientChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={patientFormData.dateOfBirth}
                  onChange={handlePatientChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contactNumber"
                  value={patientFormData.contactNumber}
                  onChange={handlePatientChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={patientFormData.address}
                  onChange={handlePatientChange}
                />
              </Grid>
            </Grid>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;
