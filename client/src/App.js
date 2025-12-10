import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  Avatar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Tab,
  Tabs,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  IconButton,
  TextField
} from '@mui/material';
import { 
  LocalHospital as LocalHospitalIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CameraAlt as CameraAltIcon
} from '@mui/icons-material';
import axios from 'axios';

// Import auth components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Import prescription components
import PrescriptionForm from './components/prescriptions/PrescriptionForm';
import PrescriptionList from './components/prescriptions/PrescriptionList';

// Import auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#134F4D',
    },
    secondary: {
      main: '#134F4D',
    },
  },
});

// Main app content component
const AppContent = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authTabValue, setAuthTabValue] = useState(0);
  const [activeContent, setActiveContent] = useState('dashboard');
  
  // Prescription management state
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, prescriptionId: null, action: null });

  // Security settings state
  const [securityForm, setSecurityForm] = useState({
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securityLoading, setSecurityLoading] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bloodType: '',
    gender: '',
    allergies: [],
    emergencyContact: { name: '', relationship: '', phone: '' },
    profilePicture: null
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [latestPrescription, setLatestPrescription] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Fetch profile data when profile is active
  useEffect(() => {
    if (activeContent === 'profile' && user) {
      fetchProfileData();
      fetchLatestPrescription();
    }
  }, [activeContent, user]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user;
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || userData.contactNumber || '',
        address: userData.address || '',
        dateOfBirth: userData.dateOfBirth || '',
        bloodType: userData.bloodType || '',
        gender: userData.gender || '',
        allergies: userData.allergies || [],
        emergencyContact: userData.emergencyContact || { name: '', relationship: '', phone: '' },
        profilePicture: userData.profilePicture || null
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Invalid file type. Only JPEG, PNG and GIF are allowed.', severity: 'error' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File size must be less than 5MB', severity: 'error' });
      return;
    }

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/users/profile/picture', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfileData(prev => ({ ...prev, profilePicture: response.data.profilePicture }));
      setSnackbar({ open: true, message: 'Profile picture updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setSnackbar({ open: true, message: 'Failed to upload profile picture', severity: 'error' });
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    setUploadingPicture(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/users/profile/picture', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfileData(prev => ({ ...prev, profilePicture: null }));
      setSnackbar({ open: true, message: 'Profile picture removed', severity: 'success' });
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      setSnackbar({ open: true, message: 'Failed to remove profile picture', severity: 'error' });
    } finally {
      setUploadingPicture(false);
    }
  };

  const fetchLatestPrescription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prescriptions = response.data;
      if (prescriptions && prescriptions.length > 0) {
        // Sort by date and get the latest
        const sorted = prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLatestPrescription(sorted[0]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    
    const updatedAllergies = [...profileData.allergies, newAllergy.trim()];
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/profile', 
        { allergies: updatedAllergies },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(prev => ({ ...prev, allergies: updatedAllergies }));
      setNewAllergy('');
      setSnackbar({ open: true, message: 'Allergy added successfully', severity: 'success' });
    } catch (error) {
      console.error('Error adding allergy:', error);
      setSnackbar({ open: true, message: 'Failed to add allergy', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRemoveAllergy = async (allergyToRemove) => {
    const updatedAllergies = profileData.allergies.filter(a => a !== allergyToRemove);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/profile', 
        { allergies: updatedAllergies },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(prev => ({ ...prev, allergies: updatedAllergies }));
      setSnackbar({ open: true, message: 'Allergy removed', severity: 'success' });
    } catch (error) {
      console.error('Error removing allergy:', error);
      setSnackbar({ open: true, message: 'Failed to remove allergy', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateContact = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/profile', 
        { 
          phone: profileData.phone,
          address: profileData.address,
          emergencyContact: profileData.emergencyContact
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Contact information updated', severity: 'success' });
    } catch (error) {
      console.error('Error updating contact:', error);
      setSnackbar({ open: true, message: 'Failed to update contact information', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Initialize security form with user data
  useEffect(() => {
    if (user) {
      setSecurityForm(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      }));
    }
  }, [user]);

  // Fetch prescriptions when manage patients is active
  useEffect(() => {
    if (activeContent === 'managePatients' && user?.role === 'doctor') {
      fetchPrescriptions();
    }
  }, [activeContent, user]);

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);

      setSnackbar({ open: true, message: 'Failed to load prescriptions', severity: 'error' });
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const handleUpdateStatus = async (prescriptionId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/prescriptions/${prescriptionId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: `Prescription ${newStatus === 'completed' ? 'terminated' : 'activated'} successfully`, severity: 'success' });
      fetchPrescriptions();
    } catch (error) {
      console.error('Error updating prescription:', error);
      setSnackbar({ open: true, message: 'Failed to update prescription', severity: 'error' });
    }
    setConfirmDialog({ open: false, prescriptionId: null, action: null });
  };

  const handleDeletePrescription = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/prescriptions/${prescriptionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Prescription deleted successfully', severity: 'success' });
      fetchPrescriptions();
    } catch (error) {
      console.error('Error deleting prescription:', error);
      setSnackbar({ open: true, message: 'Failed to delete prescription', severity: 'error' });
    }
    setConfirmDialog({ open: false, prescriptionId: null, action: null });
  };

  const handleOpenAuthDialog = (tabValue = 0) => {
    setAuthTabValue(tabValue);
    setAuthDialogOpen(true);
  };

  const handleCloseAuthDialog = () => {
    setAuthDialogOpen(false);
  };

  const handleChangeAuthTab = (event, newValue) => {
    setAuthTabValue(newValue);
  };

  // Security settings handlers
  const handleSecurityFormChange = (field) => (event) => {
    setSecurityForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleUpdateName = async () => {
    if (!securityForm.firstName.trim() || !securityForm.lastName.trim()) {
      setSnackbar({ open: true, message: 'First name and last name are required', severity: 'error' });
      return;
    }

    setSecurityLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/profile', 
        { firstName: securityForm.firstName, lastName: securityForm.lastName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Name updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating name:', error);
      setSnackbar({ open: true, message: 'Failed to update name', severity: 'error' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      setSnackbar({ open: true, message: 'All password fields are required', severity: 'error' });
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSnackbar({ open: true, message: 'New password and confirm password do not match', severity: 'error' });
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setSnackbar({ open: true, message: 'New password must be at least 6 characters', severity: 'error' });
      return;
    }

    setSecurityLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/password', 
        { currentPassword: securityForm.currentPassword, newPassword: securityForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
      setSecurityForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setSecurityLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <img 
              src="/logo-medi-vault.svg" 
              alt="Medi-Vault Logo" 
              style={{ height: '40px', marginRight: '12px' }}
              onError={(e) => {
                // Fallback to icon if logo image not found
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline';
              }}
            />
            <LocalHospitalIcon sx={{ mr: 1, display: 'none' }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Medi-Vault
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mr: 2, fontSize: '0.875rem' }}>
            Health on your fingertips
          </Typography>
          {isAuthenticated ? (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {(() => {
                  if (!user) return 'User';
                  if (user.role === 'doctor') return `Dr. ${user.lastName}`;
                  return `${user.firstName} ${user.lastName}`;
                })()}
              </Typography>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => handleOpenAuthDialog(0)}>Login</Button>
              <Button color="inherit" onClick={() => handleOpenAuthDialog(1)}>Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Authentication Dialog */}
      <Dialog 
        open={authDialogOpen} 
        onClose={handleCloseAuthDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={authTabValue} 
              onChange={handleChangeAuthTab} 
              variant="fullWidth"
            >
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>
          <Box p={3}>
            {authTabValue === 0 ? (
              <LoginForm 
                onSwitchToRegister={() => setAuthTabValue(1)} 
                onClose={handleCloseAuthDialog}
              />
            ) : (
              <RegisterForm onClose={handleCloseAuthDialog} />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(!isAuthenticated || (isAuthenticated && activeContent === 'dashboard')) && (
          <Box sx={{ my: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Digital Prescription Platform
            </Typography>
            <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
              Connecting doctors and patients seamlessly
            </Typography>
          </Box>
        )}

        {!isAuthenticated && (
          <Paper elevation={3} sx={{ p: 4, my: 4, background: 'linear-gradient(45deg, #f5f7ff 30%, #e8eaff 90%)' }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h4" component="h2" gutterBottom>
                    For Doctors
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Create digital prescriptions with QR code verification. Manage your patients and track prescription history efficiently.
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large" 
                    color="primary"
                    onClick={() => handleOpenAuthDialog(0)}
                    startIcon={<PersonIcon />}
                  >
                    Login as Doctor
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h4" component="h2" gutterBottom>
                    For Patients
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Access your prescriptions securely. Download digital copies with QR verification. Never lose a prescription again.
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large" 
                    color="secondary"
                    onClick={() => handleOpenAuthDialog(0)}
                    startIcon={<PersonIcon />}
                  >
                    Login as Patient
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {isAuthenticated && activeContent === 'dashboard' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    {user?.role === 'doctor' ? 'Create Prescription' : 'View Prescriptions'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'doctor' 
                      ? 'Create new digital prescriptions for your patients with QR code verification.' 
                      : 'Access your current and past prescriptions securely.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent(user?.role === 'doctor' ? 'createPrescription' : 'viewPrescriptions')}
                  >
                    {user?.role === 'doctor' ? 'Create New' : 'View All'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'secondary.main', mb: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    {user?.role === 'doctor' ? 'Manage Patients' : 'My Profile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'doctor' 
                      ? 'View and manage your patient list. Check patient history and details.' 
                      : 'Update your personal information and contact details.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent(user?.role === 'doctor' ? 'managePatients' : 'profile')}
                  >
                    {user?.role === 'doctor' ? 'View Patients' : 'Edit Profile'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'error.main', mb: 2 }}>
                    <SecurityIcon />
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    Security Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your password and security preferences. Manage your account security.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent('security')}
                  >
                    Manage Security
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Render active content based on state */}
        {isAuthenticated && activeContent !== 'dashboard' && (
          <Box sx={{ mt: 4 }}>
            {/* Back button */}
            <Button 
              variant="outlined" 
              sx={{ mb: 2 }}
              onClick={() => setActiveContent('dashboard')}
            >
              Back to Dashboard
            </Button>
            
            {/* Content components */}
            {activeContent === 'createPrescription' && user?.role === 'doctor' && (
              <PrescriptionForm onCreatePrescription={() => setActiveContent('dashboard')} />
            )}
            
            {activeContent === 'viewPrescriptions' && user?.role === 'patient' && (
              <PrescriptionList />
            )}
            
            {activeContent === 'managePatients' && user?.role === 'doctor' && (
              <Paper elevation={3} sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">
                    Patient Management - Prescriptions Overview
                  </Typography>
                  <IconButton onClick={fetchPrescriptions} disabled={prescriptionsLoading}>
                    <RefreshIcon />
                  </IconButton>
                </Box>

                {(() => {
                  if (prescriptionsLoading) {
                    return (
                      <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                      </Box>
                    );
                  }
                  if (prescriptions.length === 0) {
                    return (
                      <Alert severity="info">
                        No prescriptions found. Create a prescription to see it here.
                      </Alert>
                    );
                  }
                  return (
                  <>
                    {/* Active Prescriptions Section */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                      <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Active Prescriptions ({prescriptions.filter(p => p.status === 'active').length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'success.light' }}>
                            <TableCell><strong>Patient</strong></TableCell>
                            <TableCell><strong>Diagnosis</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prescriptions.filter(p => p.status === 'active').length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography color="text.secondary">No active prescriptions</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            prescriptions.filter(p => p.status === 'active').map((prescription) => (
                              <TableRow key={prescription.id} hover>
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                    {prescription.patientName || prescription.patientEmail}
                                  </Box>
                                </TableCell>
                                <TableCell>{prescription.diagnosis}</TableCell>
                                <TableCell>{new Date(prescription.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Chip label="Active" color="success" size="small" />
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<CancelIcon />}
                                    onClick={() => setConfirmDialog({ 
                                      open: true, 
                                      prescriptionId: prescription.id, 
                                      action: 'terminate' 
                                    })}
                                    sx={{ mr: 1 }}
                                  >
                                    Terminate
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setConfirmDialog({ 
                                      open: true, 
                                      prescriptionId: prescription.id, 
                                      action: 'delete' 
                                    })}
                                  >
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Completed/Terminated Prescriptions Section */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                      <CancelIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Completed/Terminated Prescriptions ({prescriptions.filter(p => p.status !== 'active').length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.200' }}>
                            <TableCell><strong>Patient</strong></TableCell>
                            <TableCell><strong>Diagnosis</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prescriptions.filter(p => p.status !== 'active').length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography color="text.secondary">No completed prescriptions</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            prescriptions.filter(p => p.status !== 'active').map((prescription) => (
                              <TableRow key={prescription.id} hover sx={{ opacity: 0.8 }}>
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                                    {prescription.patientName || prescription.patientEmail}
                                  </Box>
                                </TableCell>
                                <TableCell>{prescription.diagnosis}</TableCell>
                                <TableCell>{new Date(prescription.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Chip label="Completed" color="default" size="small" />
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => setConfirmDialog({ 
                                      open: true, 
                                      prescriptionId: prescription.id, 
                                      action: 'activate' 
                                    })}
                                    sx={{ mr: 1 }}
                                  >
                                    Reactivate
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setConfirmDialog({ 
                                      open: true, 
                                      prescriptionId: prescription.id, 
                                      action: 'delete' 
                                    })}
                                  >
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                  );
                })()}

                {/* Confirmation Dialog */}
                <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, prescriptionId: null, action: null })}>
                  <DialogTitle>
                    {(() => {
                      if (confirmDialog.action === 'delete') return 'Delete Prescription';
                      if (confirmDialog.action === 'terminate') return 'Terminate Prescription';
                      return 'Reactivate Prescription';
                    })()}
                  </DialogTitle>
                  <DialogContent>
                    <Typography>
                      {(() => {
                        if (confirmDialog.action === 'delete') return 'Are you sure you want to permanently delete this prescription? This action cannot be undone.';
                        if (confirmDialog.action === 'terminate') return 'Are you sure you want to terminate this prescription? The prescription will be marked as completed.';
                        return 'Are you sure you want to reactivate this prescription?';
                      })()}
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, prescriptionId: null, action: null })}>
                      Cancel
                    </Button>
                    <Button 
                      variant="contained"
                      color={(() => {
                        if (confirmDialog.action === 'delete') return 'error';
                        if (confirmDialog.action === 'terminate') return 'warning';
                        return 'success';
                      })()}
                      onClick={() => {
                        if (confirmDialog.action === 'delete') {
                          handleDeletePrescription(confirmDialog.prescriptionId);
                        } else {
                          handleUpdateStatus(confirmDialog.prescriptionId, confirmDialog.action === 'terminate' ? 'completed' : 'active');
                        }
                      }}
                    >
                      {(() => {
                        if (confirmDialog.action === 'delete') return 'Delete';
                        if (confirmDialog.action === 'terminate') return 'Terminate';
                        return 'Reactivate';
                      })()}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                  open={snackbar.open}
                  autoHideDuration={4000}
                  onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                  <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                  </Alert>
                </Snackbar>
              </Paper>
            )}
            
            {activeContent === 'profile' && (
              <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  User Profile
                </Typography>

                {/* Personal Information with Profile Picture */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Personal Information
                  </Typography>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box
                          sx={{
                            position: 'relative',
                            width: 150,
                            height: 150,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            '&:hover .hover-overlay': {
                              opacity: 1,
                            },
                          }}
                        >
                          <input
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            style={{ display: 'none' }}
                            id="profile-picture-upload"
                            type="file"
                            onChange={handleProfilePictureUpload}
                          />
                          <label htmlFor="profile-picture-upload" style={{ cursor: 'pointer' }}>
                            <Avatar 
                              sx={{ width: 150, height: 150, bgcolor: 'primary.main', fontSize: '3rem' }}
                              src={profileData.profilePicture ? `http://localhost:5000${profileData.profilePicture}` : undefined}
                            >
                              {!profileData.profilePicture && `${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`}
                            </Avatar>
                            <Box
                              className="hover-overlay"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                bgcolor: 'rgba(0, 0, 0, 0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                              }}
                            >
                              {uploadingPicture ? (
                                <CircularProgress size={30} sx={{ color: 'white' }} />
                              ) : (
                                <>
                                  <CameraAltIcon sx={{ color: 'white', fontSize: 32 }} />
                                  <Typography variant="caption" sx={{ color: 'white', mt: 0.5 }}>
                                    {profileData.profilePicture ? 'Change Photo' : 'Upload Photo'}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </label>
                        </Box>
                      </Box>
                      {profileData.profilePicture && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <Button
                            variant="text"
                            color="error"
                            size="small"
                            onClick={handleDeleteProfilePicture}
                            disabled={uploadingPicture}
                          >
                            Remove Photo
                          </Button>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 500 }}>
                          {profileData.firstName} {profileData.lastName}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                          {profileData.email}
                        </Typography>
                        <Chip 
                          label={user?.role === 'doctor' ? 'Doctor' : 'Patient'} 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                          <Typography variant="body1">{profileData.dateOfBirth || 'Not set'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Gender</Typography>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{profileData.gender || 'Not set'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Blood Type</Typography>
                          <Typography variant="body1">{profileData.bloodType || 'Not set'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">{profileData.phone || 'Not set'}</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Latest Diagnosis */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Latest Diagnosis
                  </Typography>
                  {latestPrescription ? (
                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {latestPrescription.diagnosis || 'No diagnosis recorded'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Prescribed by: Dr. {latestPrescription.doctorName || 'Unknown'} | 
                        Date: {new Date(latestPrescription.createdAt).toLocaleDateString()}
                      </Typography>
                      {latestPrescription.medications && latestPrescription.medications.length > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Medications: {latestPrescription.medications.map(m => m.name).join(', ')}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No prescriptions found
                    </Typography>
                  )}
                </Paper>

                {/* Allergies Section */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Allergies
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {profileData.allergies && profileData.allergies.length > 0 ? (
                      profileData.allergies.map((allergy) => (
                        <Chip
                          key={allergy}
                          label={allergy}
                          color="error"
                          variant="outlined"
                          onDelete={() => handleRemoveAllergy(allergy)}
                          deleteIcon={<CancelIcon />}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No allergies recorded
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="Add New Allergy"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      size="small"
                      sx={{ flexGrow: 1, maxWidth: 300 }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                    />
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleAddAllergy}
                      disabled={profileLoading || !newAllergy.trim()}
                      size="small"
                    >
                      Add Allergy
                    </Button>
                  </Box>
                </Paper>

                {/* Contact Information */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Contact Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Phone Number"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 500 }}>
                    Emergency Contact
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Contact Name"
                        value={profileData.emergencyContact?.name || ''}
                        onChange={(e) => setProfileData(prev => ({ 
                          ...prev, 
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                        }))}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Relationship"
                        value={profileData.emergencyContact?.relationship || ''}
                        onChange={(e) => setProfileData(prev => ({ 
                          ...prev, 
                          emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                        }))}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Contact Phone"
                        value={profileData.emergencyContact?.phone || ''}
                        onChange={(e) => setProfileData(prev => ({ 
                          ...prev, 
                          emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                        }))}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdateContact}
                    disabled={profileLoading}
                    sx={{ mt: 2 }}
                  >
                    {profileLoading ? 'Saving...' : 'Save Contact Information'}
                  </Button>
                </Paper>

                {/* Snackbar for profile notifications */}
                <Snackbar
                  open={snackbar.open}
                  autoHideDuration={4000}
                  onClose={() => setSnackbar({ ...snackbar, open: false })}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                  </Alert>
                </Snackbar>
              </Box>
            )}
            
            {activeContent === 'security' && (
              <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  Security Settings
                </Typography>

                {/* Update Name Section */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Update Name
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="First Name"
                      value={securityForm.firstName}
                      onChange={handleSecurityFormChange('firstName')}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="Last Name"
                      value={securityForm.lastName}
                      onChange={handleSecurityFormChange('lastName')}
                      fullWidth
                      variant="outlined"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUpdateName}
                      disabled={securityLoading}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {securityLoading ? 'Saving...' : 'Save Name'}
                    </Button>
                  </Box>
                </Paper>

                {/* Change Password Section */}
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Change Password
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Current Password"
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={handleSecurityFormChange('currentPassword')}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="New Password"
                      type="password"
                      value={securityForm.newPassword}
                      onChange={handleSecurityFormChange('newPassword')}
                      fullWidth
                      variant="outlined"
                      helperText="Password must be at least 6 characters"
                    />
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={handleSecurityFormChange('confirmPassword')}
                      fullWidth
                      variant="outlined"
                      error={securityForm.confirmPassword !== '' && securityForm.newPassword !== securityForm.confirmPassword}
                      helperText={securityForm.confirmPassword !== '' && securityForm.newPassword !== securityForm.confirmPassword ? 'Passwords do not match' : ''}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleChangePassword}
                      disabled={securityLoading}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {securityLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </Box>
                </Paper>

                {/* Snackbar for security notifications */}
                <Snackbar
                  open={snackbar.open}
                  autoHideDuration={4000}
                  onClose={() => setSnackbar({ ...snackbar, open: false })}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                  </Alert>
                </Snackbar>
              </Box>
            )}
          </Box>
        )}
        
        <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Medi-Vault. Health on your fingertips. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
