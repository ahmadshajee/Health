import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NewPrescription from './pages/NewPrescription';
import PrescriptionDetail from './pages/PrescriptionDetail';
import DoctorPrescriptions from './pages/DoctorPrescriptions';
import PatientManagement from './pages/PatientManagement';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prescriptions/new" 
              element={
                <ProtectedRoute requiredRole="doctor">
                  <NewPrescription />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prescriptions/all" 
              element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorPrescriptions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patients" 
              element={
                <ProtectedRoute requiredRole="doctor">
                  <PatientManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prescriptions/:id" 
              element={
                <ProtectedRoute>
                  <PrescriptionDetail />
                </ProtectedRoute>
              } 
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
