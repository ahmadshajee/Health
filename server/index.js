require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const patientRoutes = require('./routes/patients');
const prescriptionRoutes = require('./routes/prescriptions');

// Import user model for demo users
const { createDemoUsers } = require('./models/user');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
let mongoConnected = false;

// Connect to MongoDB and create demo users
const initializeApp = async () => {
  // Try to connect to MongoDB
  mongoConnected = await connectDB();
  
  if (mongoConnected) {
    console.log('Using MongoDB for data storage');
  } else {
    console.log('Using JSON file storage (fallback)');
    
    // Ensure data directory exists for JSON fallback
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
  }
  
  // Create demo users if none exist
  await createDemoUsers();
};

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
    'http://localhost:5000',
    'http://192.168.1.2',
    'http://192.168.1.2:3000',
    'http://192.168.1.2:5000',
    'https://ahmadshajee.github.io',
    'https://ahmadshajee.github.io/Health',
    'https://medizo.life',
    'https://www.medizo.life',
    'http://medizo.life',
    'http://www.medizo.life',
    'https://api.medizo.life',
    'http://api.medizo.life'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    storage: mongoConnected && mongoose.connection.readyState === 1 ? 'mongodb' : 'json',
    mongoUriConfigured: Boolean(process.env.MONGO_URI || process.env.MONGODB_URI)
  });
});

// Initialize app and start server
initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});

module.exports = app;
