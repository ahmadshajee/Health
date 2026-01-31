import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
  TextField,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  useMediaQuery,
  useTheme,
  keyframes
} from '@mui/material';
import { 
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CameraAlt as CameraAltIcon,
  Menu as MenuIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  LocalHospital as LocalHospitalIcon,
  Medication as MedicationIcon
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

// API Base URL - use Render backend in production, localhost in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://health-8zum.onrender.com'
  : 'http://localhost:5000';

// Beating heart animation for logo
const beatAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.15);
  }
  40% {
    transform: scale(1);
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

// Beating Logo Component
const BeatingLogo = ({ size = 80 }) => (
  <Box
    component="img"
    src="/LOGO.png"
    alt="Medizo Logo"
    sx={{
      width: size,
      height: size,
      animation: `${beatAnimation} 1.2s ease-in-out infinite`,
      borderRadius: '8px'
    }}
  />
);

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
  
  // Mobile responsive state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // Prescription management state
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, prescriptionId: null, action: null });
  const [viewPrescriptionDialog, setViewPrescriptionDialog] = useState({ open: false, prescription: null });
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Security settings state
  const [securityForm, setSecurityForm] = useState({
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    // Doctor-specific fields
    specialization: '',
    licenseNumber: '',
    contactNumber: '',
    email: '',
    clinicAddress: '',
    experience: '',
    qualifications: ''
  });
  const [securityLoading, setSecurityLoading] = useState(false);

  // Profile state
  const [profileTab, setProfileTab] = useState(0); // 0: Personal, 1: Allergies, 2: History, 3: Habits
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bloodType: '',
    gender: '',
    allergies: {
      environmental: [],
      food: [],
      drugs: [],
      other: []
    },
    diseaseHistory: [],
    habits: {
      smoking: '',
      alcohol: '',
      exercise: '',
      diet: '',
      sleep: '',
      other: ''
    },
    emergencyContact: { name: '', relationship: '', phone: '' },
    profilePicture: null
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [allergyCategory, setAllergyCategory] = useState('environmental');
  const [newDiseaseHistory, setNewDiseaseHistory] = useState({ disease: '', diagnosedDate: '', notes: '' });
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
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user;
      
      // Handle allergies - convert from array to categorized object if needed
      let allergiesData = userData.allergies;
      if (Array.isArray(allergiesData)) {
        // Legacy format - convert to new categorized format
        allergiesData = {
          environmental: [],
          food: [],
          drugs: [],
          other: allergiesData
        };
      } else if (!allergiesData) {
        allergiesData = { environmental: [], food: [], drugs: [], other: [] };
      }
      
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || userData.contactNumber || '',
        address: userData.address || '',
        dateOfBirth: userData.dateOfBirth || '',
        bloodType: userData.bloodType || '',
        gender: userData.gender || '',
        allergies: allergiesData,
        diseaseHistory: userData.diseaseHistory || [],
        habits: userData.habits || { smoking: '', alcohol: '', exercise: '', diet: '', sleep: '', other: '' },
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
      const response = await axios.post(`${API_BASE_URL}/api/users/profile/picture`, formData, {
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
      await axios.delete(`${API_BASE_URL}/api/users/profile/picture`, {
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
      const response = await axios.get(`${API_BASE_URL}/api/prescriptions`, {
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

  const handleAddAllergy = async (category) => {
    if (!newAllergy.trim()) return;
    
    const updatedAllergies = {
      ...profileData.allergies,
      [category]: [...(profileData.allergies[category] || []), newAllergy.trim()]
    };
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
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

  const handleRemoveAllergy = async (category, allergyToRemove) => {
    const updatedAllergies = {
      ...profileData.allergies,
      [category]: profileData.allergies[category].filter(a => a !== allergyToRemove)
    };
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
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

  const handleAddDiseaseHistory = async () => {
    if (!newDiseaseHistory.disease.trim()) return;
    
    const updatedHistory = [...(profileData.diseaseHistory || []), {
      ...newDiseaseHistory,
      id: Date.now(),
      addedAt: new Date().toISOString()
    }];
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { diseaseHistory: updatedHistory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(prev => ({ ...prev, diseaseHistory: updatedHistory }));
      setNewDiseaseHistory({ disease: '', diagnosedDate: '', notes: '' });
      setSnackbar({ open: true, message: 'Disease history added', severity: 'success' });
    } catch (error) {
      console.error('Error adding disease history:', error);
      setSnackbar({ open: true, message: 'Failed to add disease history', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRemoveDiseaseHistory = async (historyId) => {
    const updatedHistory = profileData.diseaseHistory.filter(h => h.id !== historyId);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { diseaseHistory: updatedHistory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(prev => ({ ...prev, diseaseHistory: updatedHistory }));
      setSnackbar({ open: true, message: 'Disease history removed', severity: 'success' });
    } catch (error) {
      console.error('Error removing disease history:', error);
      setSnackbar({ open: true, message: 'Failed to remove disease history', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateHabits = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { habits: profileData.habits },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Habits updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating habits:', error);
      setSnackbar({ open: true, message: 'Failed to update habits', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateContact = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
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
        lastName: user.lastName || '',
        specialization: user.specialization || '',
        licenseNumber: user.licenseNumber || '',
        contactNumber: user.contactNumber || user.phone || '',
        email: user.email || '',
        clinicAddress: user.clinicAddress || user.address || '',
        experience: user.experience || '',
        qualifications: user.qualifications || ''
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
      const response = await axios.get(`${API_BASE_URL}/api/prescriptions`, {
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
      await axios.put(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`, 
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
      await axios.delete(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`, {
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

  // Handle viewing prescription details
  const handleViewPrescription = (prescription) => {
    setViewPrescriptionDialog({ open: true, prescription });
  };

  // Handle downloading prescription PDF
  const handleDownloadPdf = async (prescription) => {
    // Handle both prescription object and prescription ID
    const prescriptionId = typeof prescription === 'object' ? (prescription.id || prescription._id) : prescription;
    
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/prescriptions/${prescriptionId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: 'PDF downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setSnackbar({ open: true, message: 'Failed to download PDF', severity: 'error' });
    } finally {
      setDownloadingPdf(false);
    }
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
      const updateData = { 
        firstName: securityForm.firstName, 
        lastName: securityForm.lastName 
      };
      
      // Include doctor-specific fields if user is a doctor
      if (user?.role === 'doctor') {
        updateData.specialization = securityForm.specialization;
        updateData.licenseNumber = securityForm.licenseNumber;
        updateData.contactNumber = securityForm.contactNumber;
        updateData.clinicAddress = securityForm.clinicAddress;
        updateData.experience = securityForm.experience;
        updateData.qualifications = securityForm.qualifications;
      }
      
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
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
      await axios.put(`${API_BASE_URL}/api/users/password`, 
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
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f5' }}>
        <BeatingLogo size={100} />
        <Typography variant="h6" sx={{ mt: 2, color: '#134F4D' }}>Loading...</Typography>
      </Box>
    );
  }

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left side - Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <img 
              src="/LOGO.png" 
              alt="Medizo Logo" 
              style={{ 
                height: isMobile ? '28px' : '36px', 
                marginRight: '8px',
                borderRadius: '4px'
              }} 
            />
            <Typography 
              variant={isMobile ? 'subtitle1' : 'h6'} 
              component="div" 
              sx={{ 
                whiteSpace: 'nowrap',
                fontWeight: 'bold'
              }}
            >
              Medizo
            </Typography>
          </Box>

          {/* Center - Tagline (hidden on mobile) */}
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '0.875rem',
              display: { xs: 'none', md: 'block' },
              textAlign: 'center',
              flex: 1,
              mx: 2
            }}
          >
            Health on your fingertips
          </Typography>

          {/* Right side - Auth buttons or user info */}
          {isMobile ? (
            // Mobile: Hamburger menu
            <IconButton
              color="inherit"
              aria-label="open menu"
              edge="end"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            // Desktop: Show buttons inline
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isAuthenticated ? (
                <>
                  <Typography variant="body1" sx={{ mr: 2, whiteSpace: 'nowrap' }}>
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
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: 250 }
        }}
      >
        <Box sx={{ p: 2, bgcolor: '#134F4D', color: 'white' }}>
          <Typography variant="h6">Medizo</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>Health on your fingertips</Typography>
        </Box>
        <List>
          {isAuthenticated ? (
            <>
              <ListItem>
                <ListItemText 
                  primary={`Welcome, ${(() => {
                    if (!user) return 'User';
                    if (user.role === 'doctor') return `Dr. ${user.lastName}`;
                    return `${user.firstName} ${user.lastName}`;
                  })()}`}
                  sx={{ color: '#134F4D' }}
                />
              </ListItem>
              <ListItemButton onClick={() => { logout(); handleDrawerToggle(); }}>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </>
          ) : (
            <>
              <ListItemButton onClick={() => { handleOpenAuthDialog(0); handleDrawerToggle(); }}>
                <ListItemText primary="Login" />
              </ListItemButton>
              <ListItemButton onClick={() => { handleOpenAuthDialog(1); handleDrawerToggle(); }}>
                <ListItemText primary="Register" />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>

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
                  <Avatar sx={{ bgcolor: user?.role === 'doctor' ? 'primary.main' : 'error.main', mb: 2 }}>
                    {user?.role === 'doctor' ? <PersonIcon /> : <SecurityIcon />}
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    {user?.role === 'doctor' ? 'My Profile' : 'Security Settings'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'doctor' 
                      ? 'Update your professional information, specialization, contact details, and security settings.'
                      : 'Update your password and security preferences. Manage your account security.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent('security')}
                  >
                    {user?.role === 'doctor' ? 'Edit Profile' : 'Manage Security'}
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
                      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={4}>
                        <BeatingLogo size={60} />
                        <Typography variant="body2" sx={{ mt: 1, color: '#134F4D' }}>Loading prescriptions...</Typography>
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
                    {/* Today's Follow-up Appointments Section */}
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      const todayAppointments = prescriptions.filter(p => {
                        if (!p.followUpDate) return false;
                        const followUp = new Date(p.followUpDate);
                        followUp.setHours(0, 0, 0, 0);
                        return followUp.getTime() === today.getTime();
                      });
                      
                      const upcomingAppointments = prescriptions.filter(p => {
                        if (!p.followUpDate) return false;
                        const followUp = new Date(p.followUpDate);
                        followUp.setHours(0, 0, 0, 0);
                        const diffDays = Math.ceil((followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return diffDays > 0 && diffDays <= 7;
                      });

                      return (
                        <>
                          {/* Today's Appointments */}
                          {todayAppointments.length > 0 && (
                            <Paper 
                              elevation={3} 
                              sx={{ 
                                p: 2, 
                                mb: 3, 
                                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                                border: '2px solid #ff9800'
                              }}
                            >
                              <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark', display: 'flex', alignItems: 'center' }}>
                                <Box component="span" sx={{ mr: 1, fontSize: '1.5rem' }}>📅</Box>
                                Today's Follow-up Appointments ({todayAppointments.length})
                              </Typography>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'warning.light' }}>
                                      <TableCell><strong>Patient</strong></TableCell>
                                      <TableCell><strong>Diagnosis</strong></TableCell>
                                      <TableCell><strong>Original Date</strong></TableCell>
                                      <TableCell><strong>Follow-up</strong></TableCell>
                                      <TableCell align="center"><strong>Actions</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {todayAppointments.map((prescription) => (
                                      <TableRow key={prescription.id} hover sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                                        <TableCell>
                                          <Box display="flex" alignItems="center">
                                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                                            <strong>{prescription.patientName || prescription.patientEmail}</strong>
                                          </Box>
                                        </TableCell>
                                        <TableCell>{prescription.diagnosis}</TableCell>
                                        <TableCell>{new Date(prescription.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                          <Chip label="TODAY" color="warning" size="small" sx={{ fontWeight: 'bold' }} />
                                        </TableCell>
                                        <TableCell align="center">
                                          <Button
                                            size="small"
                                            variant="contained"
                                            color="warning"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => handleViewPrescription(prescription)}
                                          >
                                            View
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Paper>
                          )}

                          {/* Upcoming Appointments (Next 7 Days) */}
                          {upcomingAppointments.length > 0 && (
                            <Paper 
                              elevation={2} 
                              sx={{ 
                                p: 2, 
                                mb: 3, 
                                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                border: '1px solid #2196f3'
                              }}
                            >
                              <Typography variant="h6" sx={{ mb: 2, color: 'info.dark', display: 'flex', alignItems: 'center' }}>
                                <Box component="span" sx={{ mr: 1, fontSize: '1.5rem' }}>🔔</Box>
                                Upcoming Appointments - Next 7 Days ({upcomingAppointments.length})
                              </Typography>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'info.light' }}>
                                      <TableCell><strong>Patient</strong></TableCell>
                                      <TableCell><strong>Diagnosis</strong></TableCell>
                                      <TableCell><strong>Follow-up Date</strong></TableCell>
                                      <TableCell><strong>Days Until</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {upcomingAppointments
                                      .sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime())
                                      .map((prescription) => {
                                        const followUp = new Date(prescription.followUpDate);
                                        followUp.setHours(0, 0, 0, 0);
                                        const daysUntil = Math.ceil((followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                          <TableRow key={prescription.id} hover>
                                            <TableCell>
                                              <Box display="flex" alignItems="center">
                                                <PersonIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                                                {prescription.patientName || prescription.patientEmail}
                                              </Box>
                                            </TableCell>
                                            <TableCell>{prescription.diagnosis}</TableCell>
                                            <TableCell>
                                              {new Date(prescription.followUpDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                              })}
                                            </TableCell>
                                            <TableCell>
                                              <Chip 
                                                label={daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`} 
                                                color="info" 
                                                size="small" 
                                                variant="outlined"
                                              />
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Paper>
                          )}
                        </>
                      );
                    })()}

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
                                    variant="contained"
                                    color="primary"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => handleViewPrescription(prescription)}
                                    sx={{ mr: 1 }}
                                  >
                                    View
                                  </Button>
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
                                    variant="contained"
                                    color="primary"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => handleViewPrescription(prescription)}
                                    sx={{ mr: 1 }}
                                  >
                                    View
                                  </Button>
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

                {/* View Prescription Dialog */}
                <Dialog 
                  open={viewPrescriptionDialog.open} 
                  onClose={() => setViewPrescriptionDialog({ open: false, prescription: null })}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                    <Box display="flex" alignItems="center">
                      <MedicationIcon sx={{ mr: 1 }} />
                      Prescription Details
                    </Box>
                    <IconButton onClick={() => setViewPrescriptionDialog({ open: false, prescription: null })} sx={{ color: 'white' }}>
                      <CloseIcon />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ mt: 2 }}>
                    {viewPrescriptionDialog.prescription && (
                      <Box>
                        {/* Patient & Doctor Info */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                          <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                Patient Information
                              </Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {viewPrescriptionDialog.prescription.patientName || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {viewPrescriptionDialog.prescription.patientEmail}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                <LocalHospitalIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                Prescription Info
                              </Typography>
                              <Typography variant="body2">
                                <strong>Date:</strong> {new Date(viewPrescriptionDialog.prescription.createdAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Status:</strong>{' '}
                                <Chip 
                                  label={viewPrescriptionDialog.prescription.status} 
                                  color={viewPrescriptionDialog.prescription.status === 'active' ? 'success' : 'default'} 
                                  size="small" 
                                />
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>

                        {/* Diagnosis */}
                        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light' }}>
                          <Typography variant="subtitle2" color="info.main" gutterBottom>
                            Diagnosis
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {viewPrescriptionDialog.prescription.diagnosis}
                          </Typography>
                        </Paper>

                        {/* Medications */}
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                          <MedicationIcon sx={{ mr: 1, color: 'primary.main' }} />
                          Medications
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'primary.light' }}>
                                <TableCell><strong>Medication</strong></TableCell>
                                <TableCell><strong>Dosage</strong></TableCell>
                                <TableCell><strong>Frequency</strong></TableCell>
                                <TableCell><strong>Duration</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {viewPrescriptionDialog.prescription.medications?.map((med, index) => (
                                <TableRow key={index} hover>
                                  <TableCell>{med.name}</TableCell>
                                  <TableCell>{med.dosage}</TableCell>
                                  <TableCell>{med.frequency}</TableCell>
                                  <TableCell>{med.duration}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* Doctor Notes */}
                        {viewPrescriptionDialog.prescription.notes && (
                          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.light' }}>
                            <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                              Doctor's Notes
                            </Typography>
                            <Typography variant="body2">
                              {viewPrescriptionDialog.prescription.notes}
                            </Typography>
                          </Paper>
                        )}

                        {/* QR Code */}
                        {viewPrescriptionDialog.prescription.qrCode && (
                          <Box textAlign="center" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Prescription QR Code
                            </Typography>
                            <Box 
                              component="img" 
                              src={viewPrescriptionDialog.prescription.qrCode} 
                              alt="QR Code"
                              sx={{ width: 150, height: 150, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </DialogContent>
                  <DialogActions sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Button onClick={() => setViewPrescriptionDialog({ open: false, prescription: null })}>
                      Close
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={downloadingPdf ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleDownloadPdf(viewPrescriptionDialog.prescription)}
                      disabled={downloadingPdf}
                    >
                      {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                    </Button>
                  </DialogActions>
                </Dialog>
              </Paper>
            )}
            
            {activeContent === 'profile' && (
              <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
                  My Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Update your personal information and contact details.
                </Typography>

                {/* Profile Tabs */}
                <Paper elevation={2} sx={{ mb: 3 }}>
                  <Tabs 
                    value={profileTab} 
                    onChange={(e, newValue) => setProfileTab(newValue)}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab label="PERSONAL" />
                    <Tab label="ALLERGIES" />
                    <Tab label="HISTORY" />
                    <Tab label="HABITS" />
                  </Tabs>

                  <Box sx={{ p: 3 }}>
                    {/* PERSONAL Tab */}
                    {profileTab === 0 && (
                      <>
                        {/* Profile Picture and Basic Info */}
                        <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Box
                                sx={{
                                  position: 'relative',
                                  width: 150,
                                  height: 150,
                                  borderRadius: '50%',
                                  cursor: 'pointer',
                                  '&:hover .hover-overlay': { opacity: 1 },
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
                                    src={profileData.profilePicture ? `${API_BASE_URL}${profileData.profilePicture}` : undefined}
                                  >
                                    {!profileData.profilePicture && `${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`}
                                  </Avatar>
                                  <Box
                                    className="hover-overlay"
                                    sx={{
                                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                      borderRadius: '50%', bgcolor: 'rgba(0, 0, 0, 0.6)',
                                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                      opacity: 0, transition: 'opacity 0.3s ease',
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
                                <Button variant="text" color="error" size="small" onClick={handleDeleteProfilePicture} disabled={uploadingPicture}>
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
                              <Chip label={user?.role === 'doctor' ? 'Doctor' : 'Patient'} size="small" color="primary" sx={{ mt: 1 }} />
                            </Box>
                            
                            {/* Patient ID Section - Only for Patients */}
                            {user?.role === 'patient' && (
                              <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.light' }}>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                  Your Patient ID
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  Share this ID or QR code with your doctor to add you as a patient
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        fontFamily: 'monospace', 
                                        bgcolor: 'white', 
                                        p: 1, 
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'grey.300',
                                        wordBreak: 'break-all'
                                      }}
                                    >
                                      {user?.id || user?._id || 'Loading...'}
                                    </Typography>
                                    <Button 
                                      size="small" 
                                      sx={{ mt: 1 }}
                                      onClick={() => {
                                        navigator.clipboard.writeText(user?.id || user?._id || '');
                                        setSnackbar({ open: true, message: 'Patient ID copied to clipboard!', severity: 'success' });
                                      }}
                                    >
                                      Copy ID
                                    </Button>
                                  </Box>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Box 
                                      component="img"
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(user?.id || user?._id || '')}`}
                                      alt="Patient QR Code"
                                      sx={{ 
                                        width: 100, 
                                        height: 100, 
                                        border: '1px solid', 
                                        borderColor: 'grey.300',
                                        borderRadius: 1,
                                        bgcolor: 'white',
                                        p: 0.5
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Scan to share
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            )}
                            
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

                        {/* Contact Information */}
                        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
                          Contact Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Phone Number"
                              value={profileData.phone}
                              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Address"
                              value={profileData.address}
                              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                              fullWidth variant="outlined" size="small"
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
                              onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, name: e.target.value } }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Relationship"
                              value={profileData.emergencyContact?.relationship || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, relationship: e.target.value } }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Contact Phone"
                              value={profileData.emergencyContact?.phone || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, phone: e.target.value } }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                        </Grid>
                        <Button variant="contained" color="primary" onClick={handleUpdateContact} disabled={profileLoading} sx={{ mt: 2 }}>
                          {profileLoading ? 'Saving...' : 'Save Contact Information'}
                        </Button>

                        {/* Latest Diagnosis */}
                        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 4 }}>
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
                          <Typography variant="body2" color="text.secondary">No prescriptions found</Typography>
                        )}
                      </>
                    )}

                    {/* ALLERGIES Tab */}
                    {profileTab === 1 && (
                      <>
                        {/* Environmental Allergies */}
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" gutterBottom>Environmental</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Patient has any Environmental based allergy?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {profileData.allergies?.environmental?.length > 0 ? (
                              profileData.allergies.environmental.map((allergy) => (
                                <Chip key={allergy} label={allergy} color="warning" variant="outlined"
                                  onDelete={() => handleRemoveAllergy('environmental', allergy)} deleteIcon={<CancelIcon />} />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No environmental allergies</Typography>
                            )}
                          </Box>
                          <Button variant="text" color="primary" onClick={() => { setAllergyCategory('environmental'); }}
                            sx={{ textTransform: 'none' }}>
                            + Add an Allergen
                          </Button>
                          {allergyCategory === 'environmental' && (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <TextField label="Add Environmental Allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                                size="small" sx={{ flexGrow: 1, maxWidth: 300 }} onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy('environmental')} />
                              <Button variant="contained" color="warning" onClick={() => handleAddAllergy('environmental')}
                                disabled={profileLoading || !newAllergy.trim()} size="small">Add</Button>
                            </Box>
                          )}
                        </Box>

                        {/* Food Allergies */}
                        <Box sx={{ mb: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="h6" gutterBottom>Food</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Patient has any Food based allergy?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {profileData.allergies?.food?.length > 0 ? (
                              profileData.allergies.food.map((allergy) => (
                                <Chip key={allergy} label={allergy} color="success" variant="outlined"
                                  onDelete={() => handleRemoveAllergy('food', allergy)} deleteIcon={<CancelIcon />} />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No food allergies</Typography>
                            )}
                          </Box>
                          <Button variant="text" color="primary" onClick={() => { setAllergyCategory('food'); }}
                            sx={{ textTransform: 'none' }}>
                            + Add an Allergen
                          </Button>
                          {allergyCategory === 'food' && (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <TextField label="Add Food Allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                                size="small" sx={{ flexGrow: 1, maxWidth: 300 }} onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy('food')} />
                              <Button variant="contained" color="success" onClick={() => handleAddAllergy('food')}
                                disabled={profileLoading || !newAllergy.trim()} size="small">Add</Button>
                            </Box>
                          )}
                        </Box>

                        {/* Drug Allergies */}
                        <Box sx={{ mb: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="h6" gutterBottom>Drugs</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Patient has any Drugs based allergy?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {profileData.allergies?.drugs?.length > 0 ? (
                              profileData.allergies.drugs.map((allergy) => (
                                <Chip key={allergy} label={allergy} color="error" variant="outlined"
                                  onDelete={() => handleRemoveAllergy('drugs', allergy)} deleteIcon={<CancelIcon />} />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No drug allergies</Typography>
                            )}
                          </Box>
                          <Button variant="text" color="primary" onClick={() => { setAllergyCategory('drugs'); }}
                            sx={{ textTransform: 'none' }}>
                            + Add an Allergen
                          </Button>
                          {allergyCategory === 'drugs' && (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <TextField label="Add Drug Allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                                size="small" sx={{ flexGrow: 1, maxWidth: 300 }} onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy('drugs')} />
                              <Button variant="contained" color="error" onClick={() => handleAddAllergy('drugs')}
                                disabled={profileLoading || !newAllergy.trim()} size="small">Add</Button>
                            </Box>
                          )}
                        </Box>

                        {/* Other Allergies */}
                        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="h6" gutterBottom>Other</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Patient has any Other based allergy?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {profileData.allergies?.other?.length > 0 ? (
                              profileData.allergies.other.map((allergy) => (
                                <Chip key={allergy} label={allergy} color="info" variant="outlined"
                                  onDelete={() => handleRemoveAllergy('other', allergy)} deleteIcon={<CancelIcon />} />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No other allergies</Typography>
                            )}
                          </Box>
                          <Button variant="text" color="primary" onClick={() => { setAllergyCategory('other'); }}
                            sx={{ textTransform: 'none' }}>
                            + Add an Allergen
                          </Button>
                          {allergyCategory === 'other' && (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <TextField label="Add Other Allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                                size="small" sx={{ flexGrow: 1, maxWidth: 300 }} onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy('other')} />
                              <Button variant="contained" color="info" onClick={() => handleAddAllergy('other')}
                                disabled={profileLoading || !newAllergy.trim()} size="small">Add</Button>
                            </Box>
                          )}
                        </Box>
                      </>
                    )}

                    {/* HISTORY Tab */}
                    {profileTab === 2 && (
                      <>
                        <Typography variant="h6" gutterBottom>Disease History</Typography>
                        {profileData.diseaseHistory?.length > 0 ? (
                          <Box sx={{ mb: 3 }}>
                            {profileData.diseaseHistory.map((history) => (
                              <Paper key={history.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{history.disease}</Typography>
                                    {history.diagnosedDate && (
                                      <Typography variant="body2" color="text.secondary">
                                        Diagnosed: {new Date(history.diagnosedDate).toLocaleDateString()}
                                      </Typography>
                                    )}
                                    {history.notes && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Notes: {history.notes}
                                      </Typography>
                                    )}
                                  </Box>
                                  <IconButton size="small" color="error" onClick={() => handleRemoveDiseaseHistory(history.id)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Paper>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                              You have not added any patient's disease history
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Add Disease History Form */}
                        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Add Disease History</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Disease/Condition"
                                value={newDiseaseHistory.disease}
                                onChange={(e) => setNewDiseaseHistory(prev => ({ ...prev, disease: e.target.value }))}
                                fullWidth size="small"
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Diagnosed Date"
                                type="date"
                                value={newDiseaseHistory.diagnosedDate}
                                onChange={(e) => setNewDiseaseHistory(prev => ({ ...prev, diagnosedDate: e.target.value }))}
                                fullWidth size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Notes"
                                value={newDiseaseHistory.notes}
                                onChange={(e) => setNewDiseaseHistory(prev => ({ ...prev, notes: e.target.value }))}
                                fullWidth size="small"
                              />
                            </Grid>
                          </Grid>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleAddDiseaseHistory}
                            disabled={profileLoading || !newDiseaseHistory.disease.trim()}
                            sx={{ mt: 2 }}
                          >
                            ADD DISEASE HISTORY
                          </Button>
                        </Paper>
                      </>
                    )}

                    {/* HABITS Tab */}
                    {profileTab === 3 && (
                      <>
                        <Typography variant="h6" gutterBottom>Lifestyle & Habits</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Track your lifestyle habits for better health management
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Smoking"
                              select
                              value={profileData.habits?.smoking || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, smoking: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="never">Never</option>
                              <option value="former">Former smoker</option>
                              <option value="occasional">Occasional</option>
                              <option value="regular">Regular</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Alcohol"
                              select
                              value={profileData.habits?.alcohol || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, alcohol: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="never">Never</option>
                              <option value="occasional">Occasional</option>
                              <option value="moderate">Moderate</option>
                              <option value="regular">Regular</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Exercise"
                              select
                              value={profileData.habits?.exercise || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, exercise: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="none">None</option>
                              <option value="light">Light (1-2 times/week)</option>
                              <option value="moderate">Moderate (3-4 times/week)</option>
                              <option value="active">Active (5+ times/week)</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Diet"
                              select
                              value={profileData.habits?.diet || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, diet: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="balanced">Balanced</option>
                              <option value="vegetarian">Vegetarian</option>
                              <option value="vegan">Vegan</option>
                              <option value="keto">Keto</option>
                              <option value="other">Other</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Sleep (hours/night)"
                              select
                              value={profileData.habits?.sleep || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, sleep: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="less5">Less than 5 hours</option>
                              <option value="5-6">5-6 hours</option>
                              <option value="7-8">7-8 hours</option>
                              <option value="more8">More than 8 hours</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Other Notes"
                              value={profileData.habits?.other || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, other: e.target.value } }))}
                              fullWidth
                              multiline
                              rows={1}
                            />
                          </Grid>
                        </Grid>
                        
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleUpdateHabits}
                          disabled={profileLoading}
                          sx={{ mt: 3 }}
                        >
                          {profileLoading ? 'Saving...' : 'Save Habits'}
                        </Button>
                      </>
                    )}
                  </Box>
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
              <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  {user?.role === 'doctor' ? 'Doctor Profile' : 'Profile Settings'}
                </Typography>

                {/* Basic Information Section */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        value={securityForm.firstName}
                        onChange={handleSecurityFormChange('firstName')}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Last Name"
                        value={securityForm.lastName}
                        onChange={handleSecurityFormChange('lastName')}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Email"
                        value={securityForm.email}
                        fullWidth
                        variant="outlined"
                        disabled
                        helperText="Email cannot be changed"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Doctor-specific Professional Information */}
                {user?.role === 'doctor' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Professional Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Specialization"
                          value={securityForm.specialization}
                          onChange={handleSecurityFormChange('specialization')}
                          fullWidth
                          variant="outlined"
                          placeholder="e.g., Cardiologist, General Physician"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="License Number"
                          value={securityForm.licenseNumber}
                          onChange={handleSecurityFormChange('licenseNumber')}
                          fullWidth
                          variant="outlined"
                          placeholder="Medical license number"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Years of Experience"
                          value={securityForm.experience}
                          onChange={handleSecurityFormChange('experience')}
                          fullWidth
                          variant="outlined"
                          placeholder="e.g., 10 years"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Qualifications"
                          value={securityForm.qualifications}
                          onChange={handleSecurityFormChange('qualifications')}
                          fullWidth
                          variant="outlined"
                          placeholder="e.g., MBBS, MD, FRCP"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Contact Information - for doctors */}
                {user?.role === 'doctor' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Contact Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Contact Number"
                          value={securityForm.contactNumber}
                          onChange={handleSecurityFormChange('contactNumber')}
                          fullWidth
                          variant="outlined"
                          placeholder="Phone number for patients"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Clinic/Hospital Address"
                          value={securityForm.clinicAddress}
                          onChange={handleSecurityFormChange('clinicAddress')}
                          fullWidth
                          variant="outlined"
                          multiline
                          rows={2}
                          placeholder="Your clinic or hospital address"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Save Profile Button */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdateName}
                    disabled={securityLoading}
                    fullWidth
                    size="large"
                  >
                    {securityLoading ? 'Saving...' : 'Save Profile'}
                  </Button>
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
            © {new Date().getFullYear()} Medizo. Health on your fingertips. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

// Google OAuth Client ID - Get from Google Cloud Console
// For production, we use the hardcoded value since GitHub Pages doesn't support env vars at runtime
// Client IDs are public (not secrets) - they are embedded in frontend code
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '427324625620-qbg0q3s9cgu8kd80a9upco0m9147jo1u.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
