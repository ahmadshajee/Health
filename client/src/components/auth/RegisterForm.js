import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm = ({ onClose }) => {
  const { register, loading, error, clearError } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    specialization: '',
    dateOfBirth: '',
    contactNumber: '',
    address: ''
  });
  
  const [localError, setLocalError] = useState('');
  
  const handleChange = (e) => {
    if (error || localError) {
      clearError();
      setLocalError('');
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setLocalError('Please fill in all required fields');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      
      if (formData.password.length < 6) {
        setLocalError('Password must be at least 6 characters long');
        return;
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
    setLocalError('');
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setLocalError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await register(formData);
      if (onClose) onClose();
    } catch (error) {
      // Error is handled by context
    }
  };
  
  const steps = ['Account Information', 'Personal Details', 'Review'];
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Create Your Account
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {(error || localError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || localError}
        </Alert>
      )}
      
      <Box component="form" onSubmit={activeStep === steps.length - 1 ? handleSubmit : (e) => e.preventDefault()}>
        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Register as</FormLabel>
                <RadioGroup
                  row
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <FormControlLabel value="patient" control={<Radio />} label="Patient" />
                  <FormControlLabel value="doctor" control={<Radio />} label="Doctor" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {activeStep === 1 && (
          <Grid container spacing={2}>
            {formData.role === 'doctor' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    multiline
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            )}
          </Grid>
        )}
        
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Account Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Name:</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.firstName} {formData.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Email:</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Role:</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {formData.role}
                </Typography>
              </Grid>
              {formData.role === 'doctor' && formData.specialization && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Specialization:</Typography>
                  <Typography variant="body1" color="text.secondary">
                    {formData.specialization}
                  </Typography>
                </Grid>
              )}
              {formData.role === 'patient' && formData.dateOfBirth && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Date of Birth:</Typography>
                  <Typography variant="body1" color="text.secondary">
                    {formData.dateOfBirth}
                  </Typography>
                </Grid>
              )}
              {formData.contactNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Contact:</Typography>
                  <Typography variant="body1" color="text.secondary">
                    {formData.contactNumber}
                  </Typography>
                </Grid>
              )}
              {formData.address && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Address:</Typography>
                  <Typography variant="body1" color="text.secondary">
                    {formData.address}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <div>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterForm;
