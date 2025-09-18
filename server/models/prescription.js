const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Path to prescriptions data file
const prescriptionsFilePath = path.join(__dirname, '../data/prescriptions.json');

/**
 * Get all prescriptions from the JSON file
 * @returns {Array} Array of prescriptions
 */
const getPrescriptions = () => {
  try {
    const data = fs.readFileSync(prescriptionsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading prescriptions file:', error);
    return [];
  }
};

/**
 * Save prescriptions to the JSON file
 * @param {Array} prescriptions - Array of prescriptions to save
 */
const savePrescriptions = (prescriptions) => {
  try {
    fs.writeFileSync(prescriptionsFilePath, JSON.stringify(prescriptions, null, 2));
  } catch (error) {
    console.error('Error writing prescriptions file:', error);
  }
};

/**
 * Find prescriptions by doctor ID
 * @param {string} doctorId - Doctor ID
 * @returns {Array} Array of prescriptions
 */
const findPrescriptionsByDoctorId = (doctorId) => {
  const prescriptions = getPrescriptions();
  return prescriptions.filter(prescription => prescription.doctorId === doctorId);
};

/**
 * Find prescriptions by patient ID
 * @param {string} patientId - Patient ID
 * @returns {Array} Array of prescriptions
 */
const findPrescriptionsByPatientId = (patientId) => {
  const prescriptions = getPrescriptions();
  return prescriptions.filter(prescription => prescription.patientId === patientId);
};

/**
 * Find a prescription by ID
 * @param {string} id - Prescription ID
 * @returns {Object|null} Prescription object or null if not found
 */
const findPrescriptionById = (id) => {
  const prescriptions = getPrescriptions();
  return prescriptions.find(prescription => prescription.id === id) || null;
};

/**
 * Create a new prescription
 * @param {Object} prescriptionData - Prescription data
 * @returns {Object} Created prescription object
 */
const createPrescription = async (prescriptionData) => {
  const prescriptions = getPrescriptions();
  
  // Generate prescription ID
  const prescriptionId = Date.now().toString();
  
  // Generate QR code for verification
  const qrData = JSON.stringify({
    id: prescriptionId,
    doctorId: prescriptionData.doctorId,
    patientId: prescriptionData.patientId,
    createdAt: new Date().toISOString()
  });
  
  const qrCode = await QRCode.toDataURL(qrData);
  
  // Create new prescription
  const newPrescription = {
    id: prescriptionId,
    ...prescriptionData,
    qrCode,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  // Save prescription
  prescriptions.push(newPrescription);
  savePrescriptions(prescriptions);
  
  return newPrescription;
};

/**
 * Update a prescription
 * @param {string} id - Prescription ID
 * @param {Object} prescriptionData - Prescription data to update
 * @returns {Object|null} Updated prescription object or null if not found
 */
const updatePrescription = (id, prescriptionData) => {
  const prescriptions = getPrescriptions();
  const index = prescriptions.findIndex(prescription => prescription.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Update prescription
  prescriptions[index] = {
    ...prescriptions[index],
    ...prescriptionData,
    updatedAt: new Date().toISOString()
  };
  
  savePrescriptions(prescriptions);
  return prescriptions[index];
};

/**
 * Delete a prescription
 * @param {string} id - Prescription ID
 * @returns {boolean} Success status
 */
const deletePrescription = (id) => {
  const prescriptions = getPrescriptions();
  const filteredPrescriptions = prescriptions.filter(prescription => prescription.id !== id);
  
  if (filteredPrescriptions.length === prescriptions.length) {
    return false;
  }
  
  savePrescriptions(filteredPrescriptions);
  return true;
};

module.exports = {
  getPrescriptions,
  findPrescriptionsByDoctorId,
  findPrescriptionsByPatientId,
  findPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription
};
