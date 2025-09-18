import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
  Tab,
  Tabs,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  MedicalServices as MedicalIcon,
  LocalPharmacy as PharmacyIcon,
  History as HistoryIcon,
  Bloodtype as BloodIcon,
  ContactEmergency as EmergencyIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Patient } from '../types/auth';
import { 
  getManagedPatients, 
  getPatientMedicalDetails, 
  updatePatientMedicalInfo,
  createPatient,
  updatePatient,
  deletePatient 
} from '../services/patients';

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth: string;
  contactNumber: string;
  address: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string[];
  bloodType?: string;
  insurance?: string;
}

interface EnhancedPatient extends Omit<Patient, 'medicalHistory'> {
  prescriptionHistory?: any[];
  totalPrescriptions?: number;
  latestPrescription?: any;
  activePrescriptions?: number;
  completedPrescriptions?: number;
  allMedications?: any[];
  diagnoses?: string[];
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: any;
  bloodType?: string;
  insurance?: any;
}

const EnhancedPatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<EnhancedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<EnhancedPatient | null>(null);
  const [medicalDetailsOpen, setMedicalDetailsOpen] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState<any>(null);
  const [medicalDetailsLoading, setMedicalDetailsLoading] = useState(false);
  const [editMedicalOpen, setEditMedicalOpen] = useState(false);
  const [medicalFormData, setMedicalFormData] = useState({
    allergies: [] as string[],
    medicalHistory: [] as string[],
    emergencyContact: { name: '', phone: '', relationship: '' },
    bloodType: '',
    insurance: { provider: '', policyNumber: '', groupNumber: '' }
  });
  const [tabValue, setTabValue] = useState(0);

  // Fetch managed patients on component mount
  useEffect(() => {
    fetchManagedPatients();
  }, []);

  const fetchManagedPatients = async () => {
    try {
      setLoading(true);
      const data = await getManagedPatients();
      setPatients(data as EnhancedPatient[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching managed patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMedicalDetails = async (patient: EnhancedPatient) => {
    try {
      setMedicalDetailsLoading(true);
      setSelectedPatient(patient);
      const details = await getPatientMedicalDetails(patient.id);
      setMedicalDetails(details);
      setMedicalDetailsOpen(true);
    } catch (err) {
      console.error('Error fetching medical details:', err);
      setError('Failed to load medical details');
    } finally {
      setMedicalDetailsLoading(false);
    }
  };

  const handleEditMedicalInfo = (patient: EnhancedPatient) => {
    setSelectedPatient(patient);
    setMedicalFormData({
      allergies: patient.allergies || [],
      medicalHistory: patient.medicalHistory || [],
      emergencyContact: patient.emergencyContact || { name: '', phone: '', relationship: '' },
      bloodType: patient.bloodType || '',
      insurance: patient.insurance || { provider: '', policyNumber: '', groupNumber: '' }
    });
    setEditMedicalOpen(true);
  };

  const handleSaveMedicalInfo = async () => {
    if (!selectedPatient) return;

    try {
      await updatePatientMedicalInfo(selectedPatient.id, medicalFormData);
      setEditMedicalOpen(false);
      fetchManagedPatients();
    } catch (err) {
      console.error('Error updating medical info:', err);
      setError('Failed to update medical information');
    }
  };

  const handleAddAllergy = () => {
    const newAllergy = prompt('Enter new allergy:');
    if (newAllergy && newAllergy.trim()) {
      setMedicalFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setMedicalFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleAddMedicalHistory = () => {
    const newHistory = prompt('Enter medical history item:');
    if (newHistory && newHistory.trim()) {
      setMedicalFormData(prev => ({
        ...prev,
        medicalHistory: [...prev.medicalHistory, newHistory.trim()]
      }));
    }
  };

  const handleRemoveMedicalHistory = (index: number) => {
    setMedicalFormData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Patient Management - My Patients
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {patients.length} patients under your care
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Info</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Prescriptions</TableCell>
              <TableCell>Latest Treatment</TableCell>
              <TableCell>Medical Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    No patients found. Patients will appear here after you create prescriptions for them.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PersonIcon color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          DOB: {formatDate(patient.dateOfBirth)}
                        </Typography>
                        <Chip 
                          label="Patient" 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{patient.email}</Typography>
                      </Box>
                      {patient.contactNumber && (
                        <Box display="flex" alignItems="center">
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{patient.contactNumber}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Badge badgeContent={patient.totalPrescriptions || 0} color="primary">
                        <PharmacyIcon color="action" />
                      </Badge>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {patient.totalPrescriptions || 0} Total
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {patient.activePrescriptions || 0} Active
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {patient.latestPrescription ? (
                      <Box>
                        <Typography variant="body2">
                          {patient.latestPrescription.diagnosis}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(patient.latestPrescription.createdAt)}
                        </Typography>
                        <Chip 
                          label={patient.latestPrescription.status} 
                          size="small" 
                          color={patient.latestPrescription.status === 'active' ? 'success' : 'default'}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No prescriptions yet
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="column" spacing={0.5}>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <Chip 
                          label={`${patient.allergies.length} Allergies`} 
                          size="small" 
                          color="warning" 
                          icon={<WarningIcon />}
                        />
                      )}
                      {patient.bloodType && (
                        <Chip 
                          label={patient.bloodType} 
                          size="small" 
                          color="info" 
                          icon={<BloodIcon />}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Medical Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewMedicalDetails(patient)}
                        color="primary"
                      >
                        <MedicalIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Medical Info">
                      <IconButton
                        size="small"
                        onClick={() => handleEditMedicalInfo(patient)}
                        color="secondary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Medical Details Dialog */}
      <Dialog 
        open={medicalDetailsOpen} 
        onClose={() => setMedicalDetailsOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          Medical Details - {selectedPatient?.firstName} {selectedPatient?.lastName}
        </DialogTitle>
        <DialogContent>
          {medicalDetailsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : medicalDetails && (
            <Box>
              <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Prescription History" />
                <Tab label="Medical Information" />
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Treatment Summary
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Total Prescriptions: <strong>{medicalDetails.totalPrescriptions}</strong>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Active Prescriptions: <strong>{medicalDetails.activePrescriptions}</strong>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Completed: <strong>{medicalDetails.completedPrescriptions}</strong>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Medical Alerts
                        </Typography>
                        {medicalDetails.allergies && medicalDetails.allergies.length > 0 ? (
                          medicalDetails.allergies.map((allergy: string, index: number) => (
                            <Chip 
                              key={index} 
                              label={allergy} 
                              color="warning" 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No known allergies
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Prescription History
                  </Typography>
                  {medicalDetails.prescriptionHistory && medicalDetails.prescriptionHistory.length > 0 ? (
                    medicalDetails.prescriptionHistory.map((prescription: any, index: number) => (
                      <Accordion key={prescription.id}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box display="flex" justifyContent="space-between" width="100%">
                            <Typography variant="body1">
                              {prescription.diagnosis}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDateTime(prescription.createdAt)}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Medications:
                              </Typography>
                              <List dense>
                                {prescription.medications.map((med: any, medIndex: number) => (
                                  <ListItem key={medIndex}>
                                    <ListItemText 
                                      primary={med.name}
                                      secondary={`${med.dosage} - ${med.frequency} for ${med.duration}`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Notes:
                              </Typography>
                              <Typography variant="body2">
                                {prescription.notes || 'No additional notes'}
                              </Typography>
                              <Box mt={2}>
                                <Chip 
                                  label={prescription.status}
                                  color={prescription.status === 'active' ? 'success' : 'default'}
                                  size="small"
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      No prescription history available
                    </Typography>
                  )}
                </Box>
              )}

              {tabValue === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <BloodIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Medical Information
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Blood Type: <strong>{medicalDetails.bloodType || 'Not specified'}</strong>
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Medical History:
                        </Typography>
                        {medicalDetails.medicalHistory && medicalDetails.medicalHistory.length > 0 ? (
                          <List dense>
                            {medicalDetails.medicalHistory.map((history: string, index: number) => (
                              <ListItem key={index}>
                                <ListItemText primary={history} />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No medical history recorded
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Emergency Contact
                        </Typography>
                        {medicalDetails.emergencyContact ? (
                          <Box>
                            <Typography variant="body2">
                              Name: <strong>{medicalDetails.emergencyContact.name}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Phone: <strong>{medicalDetails.emergencyContact.phone}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Relationship: <strong>{medicalDetails.emergencyContact.relationship}</strong>
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No emergency contact specified
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicalDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Medical Information Dialog */}
      <Dialog 
        open={editMedicalOpen} 
        onClose={() => setEditMedicalOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Edit Medical Information - {selectedPatient?.firstName} {selectedPatient?.lastName}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Allergies:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {medicalFormData.allergies.map((allergy, index) => (
                  <Chip
                    key={index}
                    label={allergy}
                    color="warning"
                    onDelete={() => handleRemoveAllergy(index)}
                  />
                ))}
                <Button size="small" onClick={handleAddAllergy}>
                  Add Allergy
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Medical History:
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mb={2}>
                {medicalFormData.medicalHistory.map((history, index) => (
                  <Chip
                    key={index}
                    label={history}
                    onDelete={() => handleRemoveMedicalHistory(index)}
                  />
                ))}
                <Button size="small" onClick={handleAddMedicalHistory}>
                  Add Medical History
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Blood Type"
                value={medicalFormData.bloodType}
                onChange={(e) => setMedicalFormData(prev => ({ ...prev, bloodType: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Emergency Contact:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Name"
                value={medicalFormData.emergencyContact.name}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={medicalFormData.emergencyContact.phone}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Relationship"
                value={medicalFormData.emergencyContact.relationship}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMedicalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMedicalInfo} variant="contained">
            Save Medical Information
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedPatientManagement;