const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  },
  medication: {
    type: String,
    default: ''
  },
  medications: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  testsRequired: {
    type: [String],
    default: []
  },
  dosage: {
    type: String,
    default: ''
  },
  frequency: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Transform to JSON
prescriptionSchema.methods.toJSON = function() {
  const prescription = this.toObject();
  prescription.id = prescription._id.toString();
  prescription.doctorId = prescription.doctorId.toString();
  prescription.patientId = prescription.patientId.toString();
  delete prescription.__v;
  return prescription;
};

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
