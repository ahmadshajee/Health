require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Import routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const patientRoutes = require('./routes/patients');
const prescriptionRoutes = require('./routes/prescriptions');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Create initial data files if they don't exist
const usersFilePath = path.join(dataDir, 'users.json');
const prescriptionsFilePath = path.join(dataDir, 'prescriptions.json');

if (!fs.existsSync(prescriptionsFilePath)) {
  fs.writeFileSync(prescriptionsFilePath, JSON.stringify([], null, 2));
}

// Auto-create demo users if users.json doesn't exist or is empty
const createDemoUsers = async () => {
  try {
    let users = [];
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf8');
      users = JSON.parse(data);
    }
    
    if (users.length === 0) {
      console.log('Creating demo users...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const demoUsers = [
        {
          id: '1',
          firstName: 'Dr. John',
          lastName: 'Smith',
          email: 'doctor@test.com',
          password: hashedPassword,
          role: 'doctor',
          specialization: 'General Physician',
          licenseNumber: 'DOC123456',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'patient@test.com',
          password: hashedPassword,
          role: 'patient',
          dateOfBirth: '1990-05-15',
          gender: 'female',
          phone: '555-0123',
          address: '123 Main St, City',
          bloodType: 'O+',
          allergies: ['Penicillin'],
          chronicConditions: [],
          emergencyContact: {
            name: 'Mike Johnson',
            relationship: 'Husband',
            phone: '555-0124'
          },
          createdAt: new Date().toISOString()
        }
      ];
      
      fs.writeFileSync(usersFilePath, JSON.stringify(demoUsers, null, 2));
      console.log('Demo users created: doctor@test.com / patient@test.com (password: password123)');
    }
  } catch (error) {
    console.error('Error creating demo users:', error);
  }
};

// Create demo users on startup
createDemoUsers();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://ahmadshajee.github.io',
    'https://ahmadshajee.github.io/Health',
    'https://health-ahmadshajee.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Headers:`, req.headers.authorization);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Healthcare Management System API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
