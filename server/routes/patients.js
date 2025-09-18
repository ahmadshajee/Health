const express = require('express');
const router = express.Router();
const { findUserById, updateUser, getUsers } = require('../models/user');
const { patient, auth, doctor } = require('../middleware/auth');
const { findPrescriptionsByDoctorId, findPrescriptionsByPatientId } = require('../models/prescription');

/**
 * @route   GET /api/patients
 * @desc    Get all patients
 * @access  Private (Authenticated)
 */
router.get('/', auth, async (req, res) => {
  try {
    // Get all users
    const users = getUsers();
    
    // Filter patients only
    const patients = users
      .filter(user => user.role === 'patient')
      .map(({ password, ...patient }) => patient);
    
    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private (Authenticated)
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = findUserById(patientId);
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Remove password from response
    const { password, ...patientData } = patient;
    
    res.json(patientData);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/patients/profile
 * @desc    Get current patient profile
 * @access  Private (Patient only)
 */
router.get('/profile', patient, async (req, res) => {
  try {
    const patientId = req.user.id;
    const patient = findUserById(patientId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Remove password from response
    const { password, ...patientData } = patient;
    
    res.json(patientData);
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/patients/profile
 * @desc    Update patient profile
 * @access  Private (Patient only)
 */
router.put('/profile', patient, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { firstName, lastName, dateOfBirth, contactNumber, address } = req.body;
    
    // Update user
    const updatedPatient = await updateUser(patientId, {
      firstName,
      lastName,
      dateOfBirth,
      contactNumber,
      address
    });
    
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(updatedPatient);
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/patients/doctor/managed
 * @desc    Get all patients managed by the logged-in doctor with their prescription history
 * @access  Private (Doctor only)
 */
router.get('/doctor/managed', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Get all prescriptions by this doctor
    const doctorPrescriptions = findPrescriptionsByDoctorId(doctorId);
    
    // Get unique patient IDs from prescriptions
    const patientIds = [...new Set(doctorPrescriptions.map(p => p.patientId))];
    
    // Get all users
    const users = getUsers();
    
    // Filter patients managed by this doctor
    const managedPatients = users
      .filter(user => user.role === 'patient' && patientIds.includes(user.id))
      .map(patient => {
        // Get prescriptions for this patient by this doctor
        const patientPrescriptions = doctorPrescriptions
          .filter(p => p.patientId === patient.id)
          .map(({ qrCode, ...prescriptionData }) => prescriptionData); // Remove QR code from response
        
        // Remove password from patient data
        const { password, ...patientData } = patient;
        
        return {
          ...patientData,
          prescriptionHistory: patientPrescriptions,
          totalPrescriptions: patientPrescriptions.length,
          latestPrescription: patientPrescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null
        };
      });
    
    res.json(managedPatients);
  } catch (error) {
    console.error('Get managed patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/patients/:id/medical-details
 * @desc    Get patient medical details including prescription history
 * @access  Private (Doctor only)
 */
router.get('/:id/medical-details', auth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const doctorId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Find the patient
    const patient = findUserById(patientId);
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get all prescriptions for this patient by this doctor
    const patientPrescriptions = findPrescriptionsByDoctorId(doctorId)
      .filter(p => p.patientId === patientId)
      .map(({ qrCode, ...prescriptionData }) => prescriptionData)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Remove password from patient data
    const { password, ...patientData } = patient;
    
    // Enhanced medical details
    const medicalDetails = {
      ...patientData,
      prescriptionHistory: patientPrescriptions,
      totalPrescriptions: patientPrescriptions.length,
      activePrescriptions: patientPrescriptions.filter(p => p.status === 'active').length,
      completedPrescriptions: patientPrescriptions.filter(p => p.status === 'completed').length,
      // Extract medications from prescriptions
      allMedications: patientPrescriptions.flatMap(p => p.medications || []),
      // Extract diagnoses
      diagnoses: [...new Set(patientPrescriptions.map(p => p.diagnosis).filter(Boolean))],
      // Patient medical information (if available)
      allergies: patient.allergies || [],
      medicalHistory: patient.medicalHistory || [],
      emergencyContact: patient.emergencyContact || null,
      bloodType: patient.bloodType || null,
      insurance: patient.insurance || null
    };
    
    res.json(medicalDetails);
  } catch (error) {
    console.error('Get patient medical details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/patients/:id/medical-info
 * @desc    Update patient medical information (allergies, medical history, etc.)
 * @access  Private (Doctor only)
 */
router.put('/:id/medical-info', auth, async (req, res) => {
  try {
    const patientId = req.params.id;
    const userRole = req.user.role;

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const { allergies, medicalHistory, emergencyContact, bloodType, insurance } = req.body;

    // Find the patient
    const patient = findUserById(patientId);
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update patient medical information
    const updatedPatient = await updateUser(patientId, {
      allergies: allergies || patient.allergies || [],
      medicalHistory: medicalHistory || patient.medicalHistory || [],
      emergencyContact: emergencyContact || patient.emergencyContact || null,
      bloodType: bloodType || patient.bloodType || null,
      insurance: insurance || patient.insurance || null
    });

    if (!updatedPatient) {
      return res.status(404).json({ message: 'Failed to update patient' });
    }

    res.json(updatedPatient);
  } catch (error) {
    console.error('Update patient medical info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
