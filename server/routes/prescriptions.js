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
      testsRequired,
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
      testsRequired: testsRequired || [],
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
    
    const prescription = await findPrescriptionById(prescriptionId);
    
    console.log('Download request - Prescription found:', prescription ? 'yes' : 'no');
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check access permissions - convert to strings for comparison
    const prescPatientId = prescription.patientId?.toString() || prescription.patientId;
    const prescDoctorId = prescription.doctorId?.toString() || prescription.doctorId;
    
    console.log('Download access check:', { userId, role, prescPatientId, prescDoctorId });
    
    if (role === 'patient' && prescPatientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    } else if (role === 'doctor' && prescDoctorId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get patient and doctor details
    const patient = await findUserById(prescription.patientId);
    const doctor = await findUserById(prescription.doctorId);
    
    if (!patient || !doctor) {
      return res.status(500).json({ message: 'Failed to retrieve user information' });
    }
    
    // Generate PDF
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4'
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Colors
    const primaryColor = '#134F4D';
    const textColor = '#333333';
    const lightGray = '#666666';
    
    // ============ HEADER SECTION ============
    // Doctor info (left side)
    doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
       .text(`Dr. ${doctor.firstName} ${doctor.lastName}`, 40, 40);
    
    doc.fillColor(textColor).fontSize(10).font('Helvetica');
    let headerY = 58;
    if (doctor.specialization) {
      doc.text(`${doctor.specialization}`, 40, headerY);
      headerY += 12;
    }
    if (doctor.registrationNumber) {
      doc.text(`Reg. No: ${doctor.registrationNumber}`, 40, headerY);
      headerY += 12;
    }
    if (doctor.contactNumber || doctor.phone) {
      doc.text(`Mob. No: ${doctor.contactNumber || doctor.phone}`, 40, headerY);
      headerY += 12;
    }
    
    // Clinic info (right side)
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
       .text('Medizo', 400, 40, { align: 'right' });
    doc.fillColor(textColor).fontSize(9).font('Helvetica');
    doc.text('Digital Prescription Service', 400, 56, { align: 'right' });
    doc.text('Health on your fingertips', 400, 68, { align: 'right' });
    
    // Header line
    doc.moveTo(40, 95).lineTo(555, 95).strokeColor(primaryColor).lineWidth(2).stroke();
    
    // ============ DATE & PRESCRIPTION ID ============
    let yPos = 110;
    
    // Prescription ID (barcode-style) on left
    doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
       .text(`ID: ${prescriptionId.substring(0, 12).toUpperCase()}`, 40, yPos);
    
    // Date on right
    const prescDate = prescription.createdAt ? new Date(prescription.createdAt) : new Date();
    const formattedDate = prescDate.toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    const formattedTime = prescDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
       .text(`Date: ${formattedDate}, ${formattedTime}`, 400, yPos, { align: 'right' });
    
    yPos += 25;
    
    // ============ PATIENT INFORMATION ============
    // Patient name, gender, age
    const patientAge = patient.dateOfBirth ? 
      Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) + ' Y' : '';
    const patientGender = patient.gender ? `(${patient.gender.charAt(0).toUpperCase()})` : '';
    
    doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold')
       .text(`Patient: ${patient.firstName} ${patient.lastName} ${patientGender} ${patientAge ? '/ ' + patientAge : ''}`, 40, yPos);
    yPos += 15;
    
    // Address
    if (patient.address) {
      doc.font('Helvetica').fontSize(10)
         .text(`Address: ${patient.address}`, 40, yPos);
      yPos += 12;
    }
    
    // Contact
    if (patient.contactNumber || patient.phone) {
      doc.text(`Contact: ${patient.contactNumber || patient.phone}`, 40, yPos);
      yPos += 12;
    }
    
    // Vitals (if available)
    let vitalsText = '';
    if (patient.weight) vitalsText += `Weight: ${patient.weight}kg  `;
    if (patient.height) vitalsText += `Height: ${patient.height}cm  `;
    if (patient.bloodPressure) vitalsText += `BP: ${patient.bloodPressure}  `;
    if (patient.bloodType) vitalsText += `Blood Type: ${patient.bloodType}`;
    
    if (vitalsText) {
      doc.text(vitalsText, 40, yPos);
      yPos += 12;
    }
    
    yPos += 8;
    doc.moveTo(40, yPos).lineTo(555, yPos).strokeColor('#cccccc').lineWidth(0.5).stroke();
    yPos += 15;
    
    // ============ KNOWN HISTORY (Allergies) ============
    const allergies = patient.allergies;
    let allergyList = [];
    if (allergies) {
      if (typeof allergies === 'object' && !Array.isArray(allergies)) {
        // New categorized format
        Object.values(allergies).forEach(arr => {
          if (Array.isArray(arr)) allergyList = allergyList.concat(arr);
        });
      } else if (Array.isArray(allergies)) {
        allergyList = allergies;
      }
    }
    
    if (allergyList.length > 0) {
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
         .text('Known History / Allergies:', 40, yPos);
      yPos += 12;
      doc.font('Helvetica').fontSize(10);
      allergyList.forEach(allergy => {
        doc.text(`* ${allergy}`, 50, yPos);
        yPos += 11;
      });
      yPos += 5;
    }
    
    // ============ DIAGNOSIS ============
    doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold')
       .text('Diagnosis:', 40, yPos);
    yPos += 14;
    doc.fillColor(primaryColor).font('Helvetica').fontSize(11)
       .text(`* ${prescription.diagnosis || 'Not specified'}`, 50, yPos);
    yPos += 20;
    
    // ============ Rx SYMBOL & MEDICATIONS ============
    // Draw Rx symbol
    doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold')
       .text('℞', 40, yPos);
    yPos += 30;
    
    // Medications table header
    doc.fillColor('#ffffff').rect(40, yPos, 515, 20).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Medicine Name', 50, yPos + 5);
    doc.text('Dosage', 280, yPos + 5);
    doc.text('Duration', 420, yPos + 5);
    yPos += 25;
    
    // Medications list
    if (prescription.medications && prescription.medications.length > 0) {
      doc.fillColor(textColor).font('Helvetica').fontSize(10);
      prescription.medications.forEach((med, index) => {
        // Check if we need a new page
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.fillColor('#f5f5f5').rect(40, yPos - 3, 515, 35).fill();
        }
        
        // Medicine type prefix
        const medType = med.type === 'capsule' ? 'CAP.' : 
                       med.type === 'tablet' ? 'TAB.' : 
                       med.type === 'syrup' ? 'SYR.' : 
                       med.type === 'injection' ? 'INJ.' : '';
        
        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10);
        doc.text(`${index + 1}) ${medType} ${med.name}`.toUpperCase(), 50, yPos);
        
        doc.font('Helvetica').fontSize(9);
        // Dosage info
        let dosageInfo = '';
        if (med.dosage) dosageInfo += med.dosage;
        if (med.frequency) dosageInfo += ` - ${med.frequency}`;
        if (med.timing) dosageInfo += ` (${med.timing})`;
        doc.text(dosageInfo || 'As directed', 280, yPos);
        
        // Duration
        let durationInfo = med.duration || '';
        if (med.totalCount) durationInfo += ` (Tot: ${med.totalCount})`;
        doc.text(durationInfo || '-', 420, yPos);
        
        yPos += 35;
      });
    } else {
      doc.fillColor(lightGray).text('No medications specified', 50, yPos);
      yPos += 20;
    }
    
    yPos += 10;
    
    // ============ INVESTIGATIONS ============
    if (prescription.investigations) {
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
         .text('Investigations:', 40, yPos);
      yPos += 12;
      doc.font('Helvetica').fontSize(10);
      const investigations = prescription.investigations.split(',').map(i => i.trim());
      investigations.forEach(inv => {
        if (inv) {
          doc.text(`* ${inv}`, 50, yPos);
          yPos += 11;
        }
      });
      yPos += 8;
    }
    
    // ============ TESTS REQUIRED ============
    if (prescription.testsRequired && prescription.testsRequired.length > 0) {
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
         .text('Tests Required:', 40, yPos);
      yPos += 12;
      doc.font('Helvetica').fontSize(10);
      prescription.testsRequired.forEach(test => {
        doc.text(`* ${test}`, 50, yPos);
        yPos += 11;
      });
      yPos += 8;
    }
    
    // ============ SPECIAL INSTRUCTIONS / ADVICE ============
    if (prescription.instructions) {
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
         .text('Advice Given:', 40, yPos);
      yPos += 12;
      doc.font('Helvetica').fontSize(10)
         .text(`* ${prescription.instructions}`, 50, yPos, { width: 480 });
      yPos += 25;
    }
    
    // ============ FOLLOW-UP DATE ============
    if (prescription.followUpDate) {
      const followUp = new Date(prescription.followUpDate);
      const followUpFormatted = followUp.toLocaleDateString('en-GB', { 
        day: '2-digit', month: 'long', year: 'numeric' 
      });
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
         .text(`Follow Up: ${followUpFormatted}`, 40, yPos);
      yPos += 25;
    }
    
    // ============ SIGNATURE ============
    doc.fillColor(textColor).fontSize(12).font('Helvetica-Oblique')
       .text('Signature', 450, yPos + 20, { align: 'right' });
    doc.moveTo(400, yPos + 35).lineTo(555, yPos + 35).strokeColor('#333333').lineWidth(0.5).stroke();
    doc.fontSize(10).font('Helvetica')
       .text(`Dr. ${doctor.firstName} ${doctor.lastName}`, 400, yPos + 40, { align: 'right' });
    
    // ============ QR CODE ============
    // Generate QR code
    try {
      const qrData = JSON.stringify({
        id: prescription.id || prescriptionId,
        doctor: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        patient: `${patient.firstName} ${patient.lastName}`,
        date: prescDate.toISOString(),
        diagnosis: prescription.diagnosis
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrCodeBuffer = Buffer.from(base64Data, 'base64');
      
      // Position QR code at bottom left
      const qrY = Math.max(yPos + 60, 700);
      doc.image(qrCodeBuffer, 40, qrY, { width: 70, height: 70 });
      doc.fontSize(8).fillColor(lightGray)
         .text('Scan to verify', 40, qrY + 72, { width: 70, align: 'center' });
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
    }
    
    // ============ FOOTER ============
    doc.fontSize(8).fillColor(lightGray)
       .text('This is a digitally generated prescription from Medizo', 40, 780, { align: 'center', width: 515 });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 790, { align: 'center', width: 515 });
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Download prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
