const express = require('express');
const router = express.Router();
const { findUserById, updateUser, getUsers } = require('../models/user');
const { doctor } = require('../middleware/auth');

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors
 * @access  Private (Doctor only)
 */
router.get('/', doctor, async (req, res) => {
  try {
    // Get all users (async)
    const users = await getUsers();
    
    // Filter doctors only
    const doctors = users
      .filter(user => user.role === 'doctor')
      .map(({ password, ...doctor }) => doctor);
    
    res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/doctors/profile
 * @desc    Get current doctor profile
 * @access  Private (Doctor only)
 */
router.get('/profile', doctor, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const doctor = await findUserById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Remove password from response
    const { password, ...doctorData } = doctor;
    
    res.json(doctorData);
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/doctors/profile
 * @desc    Update doctor profile
 * @access  Private (Doctor only)
 */
router.put('/profile', doctor, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { firstName, lastName, specialization, contactNumber } = req.body;
    
    // Update user
    const updatedDoctor = await updateUser(doctorId, {
      firstName,
      lastName,
      specialization,
      contactNumber
    });
    
    if (!updatedDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(updatedDoctor);
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
