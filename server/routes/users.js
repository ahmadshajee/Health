const express = require('express');
const router = express.Router();
const { getUsers, findUserById, updateUser } = require('../models/user');
const { auth, doctor, patient } = require('../middleware/auth');

/**
 * @route   GET /api/users/patients
 * @desc    Get all patients (doctors only)
 * @access  Private (Doctor)
 */
router.get('/patients', doctor, (req, res) => {
  console.log('GET /patients endpoint hit');
  console.log('User:', req.user);
  try {
    const users = getUsers();
    console.log('Total users:', users.length);
    const patients = users
      .filter(user => user.role === 'patient')
      .map(patient => {
        // Remove sensitive data
        const { password, ...patientData } = patient;
        return patientData;
      });

    console.log('Filtered patients:', patients.length);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({
      message: 'Patients retrieved successfully',
      patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/patients/lookup
 * @desc    Get patients lookup data for prescription creation
 * @access  Private (Doctor)
 */
router.get('/patients/lookup', doctor, (req, res) => {
  try {
    const users = getUsers();
    const patientsLookup = users
      .filter(user => user.role === 'patient')
      .map(patient => ({
        id: patient.id,
        email: patient.email,
        name: `${patient.firstName} ${patient.lastName}`,
        firstName: patient.firstName,
        lastName: patient.lastName,
        contactNumber: patient.contactNumber,
        dateOfBirth: patient.dateOfBirth
      }));

    console.log('Patients lookup data:', patientsLookup);
    res.json({
      message: 'Patients lookup data retrieved successfully',
      patients: patientsLookup
    });
  } catch (error) {
    console.error('Get patients lookup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/doctors
 * @desc    Get all doctors
 * @access  Private
 */
router.get('/doctors', auth, (req, res) => {
  try {
    const users = getUsers();
    const doctors = users
      .filter(user => user.role === 'doctor')
      .map(doctor => {
        // Remove sensitive data
        const { password, ...doctorData } = doctor;
        return doctorData;
      });

    res.json({
      message: 'Doctors retrieved successfully',
      doctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth, (req, res) => {
  try {
    const user = findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const { password, ...userProfile } = user;
    
    res.json({
      message: 'Profile retrieved successfully',
      user: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, specialization, dateOfBirth, address } = req.body;
    
    const updateData = {
      firstName,
      lastName,
      contactNumber,
      ...(req.user.role === 'doctor' && { specialization }),
      ...(req.user.role === 'patient' && { dateOfBirth, address })
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await updateUser(req.user.id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Verify current password
    const user = findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    const updatedUser = await updateUser(req.user.id, { password: newPassword });
    
    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/patients/:id
 * @desc    Get specific patient by ID (doctors only)
 * @access  Private (Doctor)
 */
router.get('/patients/:id', doctor, (req, res) => {
  try {
    const patient = findUserById(req.params.id);
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const { password, ...patientData } = patient;
    res.json(patientData);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/patients/:id
 * @desc    Update patient (doctors only)
 * @access  Private (Doctor)
 */
router.put('/patients/:id', doctor, async (req, res) => {
  try {
    const patient = findUserById(req.params.id);
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const updateData = req.body;
    // Don't allow role changes through this endpoint
    delete updateData.role;
    delete updateData.id;

    const updatedPatient = await updateUser(req.params.id, updateData);
    const { password, ...patientData } = updatedPatient;
    
    res.json({
      message: 'Patient updated successfully',
      patient: patientData
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/users/patients/:id
 * @desc    Delete patient (doctors only)
 * @access  Private (Doctor)
 */
router.delete('/patients/:id', doctor, (req, res) => {
  try {
    const { deleteUser } = require('../models/user');
    const patient = findUserById(req.params.id);
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    deleteUser(req.params.id);
    
    res.json({
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
