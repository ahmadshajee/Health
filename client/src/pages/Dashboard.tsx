import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Tab, 
  Tabs,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPrescriptions } from '../services/prescriptions';
import { Prescription } from '../types/prescription';
import EnhancedPatientManagement from '../components/EnhancedPatientManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prescription-tabpanel-${index}`}
      aria-labelledby={`prescription-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  
  const [tabValue, setTabValue] = useState(0);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch prescriptions on component mount
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const data = await getPrescriptions();
        setPrescriptions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescriptions();
  }, []);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Filter prescriptions by status
  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const completedPrescriptions = prescriptions.filter(p => p.status === 'completed');
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {user?.role === 'doctor' && (
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 3 }}
          onClick={() => navigate('/prescriptions/new')}
        >
          Create New Prescription
        </Button>
      )}
      
      <Paper elevation={3} sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered={user?.role !== 'doctor'}
        >
          <Tab label={`Active (${activePrescriptions.length})`} />
          <Tab label={`Completed (${completedPrescriptions.length})`} />
          {user?.role === 'doctor' && (
            <Tab label="Manage Patients" />
          )}
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {activePrescriptions.length === 0 ? (
                <Typography>No active prescriptions found</Typography>
              ) : (
                <List>
                  {activePrescriptions.map((prescription, index) => (
                    <React.Fragment key={prescription.id}>
                      <ListItem 
                        button 
                        onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                      >
                        <ListItemText
                          primary={prescription.medication}
                          secondary={`Dosage: ${prescription.dosage} | Created: ${new Date(prescription.createdAt).toLocaleDateString()}`}
                        />
                      </ListItem>
                      {index < activePrescriptions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {completedPrescriptions.length === 0 ? (
                <Typography>No completed prescriptions found</Typography>
              ) : (
                <List>
                  {completedPrescriptions.map((prescription, index) => (
                    <React.Fragment key={prescription.id}>
                      <ListItem 
                        button 
                        onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                      >
                        <ListItemText
                          primary={prescription.medication}
                          secondary={`Dosage: ${prescription.dosage} | Created: ${new Date(prescription.createdAt).toLocaleDateString()}`}
                        />
                      </ListItem>
                      {index < completedPrescriptions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
            
            {user?.role === 'doctor' && (
              <TabPanel value={tabValue} index={2}>
                <EnhancedPatientManagement />
              </TabPanel>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;
