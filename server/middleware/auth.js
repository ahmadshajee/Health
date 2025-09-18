const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/user');

/**
 * Authenticate JWT token and add user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const auth = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get full user data
    const user = findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    
    // Add user to request
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Check if user is a doctor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const doctor = (req, res, next) => {
  // First authenticate user
  auth(req, res, () => {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: Doctors only' });
    }
    next();
  });
};

/**
 * Check if user is a patient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const patient = (req, res, next) => {
  // First authenticate user
  auth(req, res, () => {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied: Patients only' });
    }
    next();
  });
};

module.exports = {
  auth,
  doctor,
  patient
};
