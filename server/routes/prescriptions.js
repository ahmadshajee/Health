const express = require('express');
const router = express.Router();
const { 
  createPrescription, 
  findPrescriptionById, 
  findPrescriptionsByDoctorId,
  findPrescriptionsByPatientId,
  updatePrescription,
  deletePrescription
} = require('../models/prescription');
const { findUserById } = require('../models/user');
const { auth, doctor } = require('../middleware/auth');
const { sendPrescriptionNotification } = require('../services/email');

/**
 * @route   GET /api/prescriptions
 * @desc    Get prescriptions based on user role
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    
    console.log('Getting prescriptions for user:', userId, 'role:', role);
    
    let prescriptions = [];
    
    // Get prescriptions based on role
    if (role === 'doctor') {
      prescriptions = await findPrescriptionsByDoctorId(userId);
      console.log('Found', prescriptions.length, 'prescriptions for doctor');
      
      // Enhance with patient information
      prescriptions = await Promise.all(prescriptions.map(async (prescription) => {
        const patient = await findUserById(prescription.patientId);
        return {
          ...prescription,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
          patientEmail: patient ? patient.email : 'N/A'
        };
      }));
    } else if (role === 'patient') {
      prescriptions = await findPrescriptionsByPatientId(userId);
      console.log('Found', prescriptions.length, 'prescriptions for patient');
      
      // Enhance with doctor information
      prescriptions = await Promise.all(prescriptions.map(async (prescription) => {
        const doctor = await findUserById(prescription.doctorId);
        return {
          ...prescription,
          doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor',
          doctorSpecialization: doctor ? doctor.specialization : 'N/A'
        };
      }));
    }
    
    // Sort by creation date (newest first)
    prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(prescriptions);
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/prescriptions/stats
 * @desc    Get prescription statistics for doctor
 * @access  Private (Doctor only)
 */
router.get('/stats', doctor, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const prescriptions = await findPrescriptionsByDoctorId(doctorId);
    
    const recentPrescriptions = await Promise.all(
      prescriptions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(async (p) => {
          const patient = await findUserById(p.patientId);
          return {
            id: p.id,
            diagnosis: p.diagnosis,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
            createdAt: p.createdAt,
            status: p.status
          };
        })
    );
    
    const stats = {
      total: prescriptions.length,
      active: prescriptions.filter(p => p.status === 'active').length,
      completed: prescriptions.filter(p => p.status === 'completed').length,
      thisMonth: prescriptions.filter(p => {
        const prescriptionDate = new Date(p.createdAt);
        const now = new Date();
        return prescriptionDate.getMonth() === now.getMonth() && 
               prescriptionDate.getFullYear() === now.getFullYear();
      }).length,
      uniquePatients: [...new Set(prescriptions.map(p => p.patientId))].length,
      recentPrescriptions
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get prescription stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/prescriptions/:id
 * @desc    Get prescription by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const prescription = await findPrescriptionById(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check if user has access to prescription
    const userId = req.user.id;
    const role = req.user.role;
    
    if (
      (role === 'doctor' && prescription.doctorId !== userId) && 
      (role === 'patient' && prescription.patientId !== userId)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(prescription);
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/prescriptions
 * @desc    Create a new prescription
 * @access  Private (Doctor only)
 */
router.post('/', doctor, async (req, res) => {
  try {
    const { 
      patientId,
      patientEmail, 
      diagnosis,
      medications,
      instructions,
      followUpDate
    } = req.body;
    
    const doctorId = req.user.id;
    
    // Resolve patient by id first, then by email (case-insensitive)
    const { getUsers } = require('../models/user');
    const users = await getUsers();
    let patient = null;

    if (patientId) {
      patient = users.find(u => u.id === String(patientId) && u.role === 'patient') || null;
    }
    if (!patient && patientEmail) {
      const target = String(patientEmail).toLowerCase();
      patient = users.find(u => String(u.email).toLowerCase() === target && u.role === 'patient') || null;
    }
    
    if (!patient) {
      // Log available patients for debugging
      const availablePatients = users.filter(user => user.role === 'patient');
      console.log('Patient not found. Available patients:', availablePatients.map(p => ({ 
        id: p.id, 
        email: p.email, 
        name: `${p.firstName} ${p.lastName}` 
      })));
      console.log('Searched for email:', patientEmail);
      
      return res.status(404).json({ 
        message: 'Patient not found',
        searched: { patientId, patientEmail },
        availablePatients: availablePatients.map(p => ({ 
          id: p.id, 
          email: p.email, 
          name: `${p.firstName} ${p.lastName}` 
        }))
      });
    }
    
    // Create prescription
    const prescription = await createPrescription({
      doctorId,
  patientId: patient.id,
  patientEmail: patient.email,
      diagnosis,
      medications,
      instructions,
      followUpDate
    });
    
    // Get doctor data for email notification
    const doctor = await findUserById(doctorId);
    
    // Send email notification to patient (optional - don't fail if email fails)
    try {
      await sendPrescriptionNotification(patient, prescription, doctor);
      console.log('Email notification sent successfully to:', patient.email);
    } catch (emailError) {
      console.log('Email notification failed (continuing anyway):', emailError.message);
    }
    
    res.status(201).json(prescription);
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/prescriptions/:id
 * @desc    Update a prescription
 * @access  Private (Doctor only)
 */
router.put('/:id', doctor, async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const doctorId = req.user.id;
    const prescription = await findPrescriptionById(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check if doctor is the owner of the prescription
    if (prescription.doctorId !== doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { 
      medication, 
      dosage, 
      frequency, 
      duration, 
      instructions,
      notes,
      status
    } = req.body;
    
    // Update prescription
    const updatedPrescription = updatePrescription(prescriptionId, {
      medication,
      dosage,
      frequency,
      duration,
      instructions,
      notes,
      status
    });
    
    res.json(updatedPrescription);
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/prescriptions/:id
 * @desc    Delete a prescription
 * @access  Private (Doctor only)
 */
router.delete('/:id', doctor, async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const doctorId = req.user.id;
    const prescription = findPrescriptionById(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check if doctor is the owner of the prescription
    if (prescription.doctorId !== doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete prescription
    const success = deletePrescription(prescriptionId);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to delete prescription' });
    }
    
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/prescriptions/:id/download
 * @desc    Download prescription as PDF
 * @access  Private
 */
router.get('/:id/download', auth, async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;
    
    const prescription = findPrescriptionById(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check access permissions
    if (role === 'patient' && prescription.patientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'doctor' && prescription.doctorId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get patient and doctor details
    const patient = findUserById(prescription.patientId);
    const doctor = findUserById(prescription.doctorId);
    
    if (!patient || !doctor) {
      return res.status(500).json({ message: 'Failed to retrieve user information' });
    }
    
    // Generate PDF
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');
    
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add header
    doc.fontSize(20).text('MEDI-VAULT', 50, 50);
    doc.fontSize(16).text('Medical Prescription', 50, 80);
    doc.moveTo(50, 100).lineTo(550, 100).stroke();
    
    // Add prescription details
    let yPosition = 130;
    
    doc.fontSize(12).text(`Prescription ID: ${prescription.id}`, 50, yPosition);
    yPosition += 20;
    doc.text(`Date: ${new Date(prescription.date).toLocaleDateString()}`, 50, yPosition);
    yPosition += 30;
    
    // Patient information
    doc.fontSize(14).text('Patient Information:', 50, yPosition);
    yPosition += 20;
    doc.fontSize(12).text(`Name: ${patient.firstName} ${patient.lastName}`, 70, yPosition);
    yPosition += 15;
    doc.text(`Email: ${patient.email}`, 70, yPosition);
    yPosition += 15;
    if (patient.dateOfBirth) {
      doc.text(`Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`, 70, yPosition);
      yPosition += 15;
    }
    if (patient.contactNumber) {
      doc.text(`Contact: ${patient.contactNumber}`, 70, yPosition);
      yPosition += 15;
    }
    yPosition += 20;
    
    // Doctor information
    doc.fontSize(14).text('Prescribed By:', 50, yPosition);
    yPosition += 20;
    doc.fontSize(12).text(`Dr. ${doctor.firstName} ${doctor.lastName}`, 70, yPosition);
    yPosition += 15;
    if (doctor.specialization) {
      doc.text(`Specialization: ${doctor.specialization}`, 70, yPosition);
      yPosition += 15;
    }
    doc.text(`Contact: ${doctor.contactNumber}`, 70, yPosition);
    yPosition += 30;
    
    // Diagnosis
    doc.fontSize(14).text('Diagnosis:', 50, yPosition);
    yPosition += 20;
    doc.fontSize(12).text(prescription.diagnosis, 70, yPosition);
    yPosition += 30;
    
    // Medications
    doc.fontSize(14).text('Medications:', 50, yPosition);
    yPosition += 20;
    
    prescription.medications.forEach((med, index) => {
      doc.fontSize(12).text(`${index + 1}. ${med.name}`, 70, yPosition);
      yPosition += 15;
      doc.text(`   Dosage: ${med.dosage}`, 70, yPosition);
      yPosition += 15;
      doc.text(`   Frequency: ${med.frequency}`, 70, yPosition);
      yPosition += 15;
      doc.text(`   Duration: ${med.duration}`, 70, yPosition);
      yPosition += 20;
    });
    
    // Instructions
    if (prescription.instructions) {
      doc.fontSize(14).text('Instructions:', 50, yPosition);
      yPosition += 20;
      doc.fontSize(12).text(prescription.instructions, 70, yPosition, { width: 450 });
      yPosition += 40;
    }
    
    // Follow-up date
    if (prescription.followUpDate) {
      doc.fontSize(12).text(`Follow-up Date: ${new Date(prescription.followUpDate).toLocaleDateString()}`, 50, yPosition);
      yPosition += 30;
    }
    
    // Add QR code section
    doc.fontSize(12).text('QR Code for Verification:', 50, yPosition);
    yPosition += 25;
    
    // Generate QR code if not available
    if (!prescription.qrCode) {
      console.log('Generating QR code for prescription:', prescription.id);
      try {
        const QRCode = require('qrcode');
        const qrData = JSON.stringify({
          id: prescription.id,
          doctorId: prescription.doctorId,
          patientId: prescription.patientId,
          createdAt: prescription.createdAt
        });
        prescription.qrCode = await QRCode.toDataURL(qrData);
        console.log('QR code generated successfully');
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }

    // Add the actual QR code image if available
    if (prescription.qrCode) {
      try {
        console.log('Adding QR code to PDF for prescription:', prescription.id);
        console.log('QR code length:', prescription.qrCode.length);
        
        // Convert base64 QR code to buffer and embed in PDF
        const base64Data = prescription.qrCode.replace(/^data:image\/png;base64,/, '');
        const qrCodeBuffer = Buffer.from(base64Data, 'base64');
        
        console.log('QR code buffer size:', qrCodeBuffer.length);
        
        // Add QR code image to PDF
        doc.image(qrCodeBuffer, 50, yPosition, { width: 100, height: 100 });
        
        // Add QR code description next to the image
        doc.fontSize(10).text('Scan this QR code to verify prescription authenticity', 170, yPosition + 20, { width: 300 });
        doc.text(`Prescription ID: ${prescription.id}`, 170, yPosition + 40);
        doc.text(`Generated: ${new Date(prescription.createdAt).toLocaleDateString()}`, 170, yPosition + 55);
        
        yPosition += 120;
        console.log('QR code successfully added to PDF');
      } catch (error) {
        console.error('Error adding QR code to PDF:', error);
        console.error('QR code data preview:', prescription.qrCode ? prescription.qrCode.substring(0, 100) + '...' : 'No QR code');
        
        // Fallback to text if QR code image fails
        doc.text(`QR Code Error - Verification Code: RX-${prescription.id}`, 50, yPosition);
        doc.text(`Contact support with prescription ID: ${prescription.id}`, 50, yPosition + 15);
        yPosition += 40;
      }
    } else {
      console.log('No QR code available for prescription:', prescription.id);
      // Fallback if no QR code available
      doc.text(`No QR Code Available - Verification Code: RX-${prescription.id}`, 50, yPosition);
      yPosition += 25;
    }
    
    // Footer
    doc.fontSize(10).text('This prescription is digitally generated and verified.', 50, 750);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 50, 765);
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Download prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
