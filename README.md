# Healthcare Management System

A comprehensive healthcare management system built with React.js and Node.js, featuring prescription management, patient records, and medical history tracking.

## 🚀 Overview

This system provides a complete healthcare management solution where doctors can manage patients, create digital prescriptions with QR codes, track medical history, and patients can access their medical records securely.

## 🚀 Features

### For Doctors
- **Patient Management**: View and manage patients with comprehensive medical records
- **Prescription System**: Create, manage, and track prescriptions with QR codes
- **Medical History**: Access detailed patient medical history and allergies
- **Prescription Analytics**: Track active, completed, and total prescriptions per patient
- **PDF Generation**: Generate prescription PDFs with embedded QR codes for verification

### For Patients  
- **Profile Management**: Update personal and medical information
- **Prescription History**: View prescription history and current medications
- **Medical Records**: Access personal medical data and treatment history

### System Features
- **Secure Authentication**: JWT-based authentication with role-based access control
- **QR Code Integration**: QR codes embedded in prescription PDFs for verification
- **Email Notifications**: Automated email notifications for prescription updates
- **Responsive Design**: Modern Material-UI interface that works on all devices
- **Real-time Updates**: Live updates across the application

## Tech Stack

### Frontend
- React with JavaScript/TypeScript
- Material UI for UI components
- Axios for API requests
- QR code display library

### Backend
- Node.js with Express
- JWT for authentication
- Nodemailer for email notifications
- QR code generation
- JSON file-based data storage

## Workflow

1. Doctor logs in to the system
2. Doctor creates a digital prescription
3. Patient receives an email notification
4. Patient views/downloads the prescription
5. QR code verification for prescription authenticity

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- npm or yarn package manager

### Client Setup
```bash
cd client
npm install
npm start
```

### Server Setup
```bash
cd server
npm install
npm start
```

## Project Structure

```
/
├── client/                 # React frontend
│   ├── public/             # Public assets
│   └── src/                # Source files
│       ├── components/     # React components
│       │   ├── auth/       # Authentication components (LoginForm, RegisterForm)
│       │   └── prescriptions/ # Prescription components (PrescriptionForm, PrescriptionList)
│       ├── contexts/       # Context providers
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── types/          # TypeScript type definitions
│       └── utils/          # Utility functions
│
└── server/                 # Node.js Express backend
    ├── controllers/        # Request controllers
    ├── middleware/         # Express middleware
    ├── models/             # Data models
    ├── routes/             # API routes
    ├── services/           # Business logic
    ├── data/               # JSON storage
    └── utils/              # Utility functions
```

## Key Components

### Authentication
- **LoginForm**: Handles user authentication with email/password and role selection
- **RegisterForm**: Multi-step registration process with role-specific fields

### Prescriptions
- **PrescriptionForm**: For doctors to create new prescriptions with medication details
- **PrescriptionList**: For patients to view and download their prescriptions
- **QR Code Generation**: Secure verification of prescription authenticity
