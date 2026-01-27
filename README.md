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
- **Secure Authentication**: JWT-based authentication with role-based access control
- **Google OAuth Login**: Sign in with Google for quick and secure access
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

### Environment Variables
- `MONGO_URI` (preferred) or `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: secret used to sign auth tokens
- `PORT`: optional, defaults to 5000
- `NODE_ENV`: set to `production` in hosted environments
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID (server)
- `REACT_APP_GOOGLE_CLIENT_ID`: Google OAuth Client ID (client)

The backend exposes `/health` for Render health checks and reports whether MongoDB is connected.

### Google OAuth Setup (Free)

To enable "Sign in with Google":

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Select **Web application** as the application type
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
7. Copy the **Client ID** and set it in both:
   - Server: `GOOGLE_CLIENT_ID` environment variable
   - Client: `REACT_APP_GOOGLE_CLIENT_ID` environment variable

Example `.env` files are provided: `client/.env.example` and `server/.env.example`

### Using MongoDB Atlas (Render / Production)
- Recommended: set `MONGO_URI` or `MONGODB_URI` as an environment variable in your host (Render, Heroku, etc.).
- If you cannot set environment variables, you may create a local file `server/config/mongo.json` with this shape (development only):

```json
{
  "MONGO_URI": "mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority"
}
```

- A template is provided at `server/config/mongo.example.json`. Do **not** commit `server/config/mongo.json` — it is included in `.gitignore` for safety.
- After configuring the URI, restart the server — the app will use MongoDB instead of JSON files for persistent storage.

### Migrating existing JSON data into MongoDB
If you have existing users/prescriptions stored in `server/data/*.json` and want to import them into MongoDB Atlas:

1. Ensure `MONGO_URI` is set (or `server/config/mongo.json` exists).
2. From the `server` folder run:

```bash
npm run migrate
```

3. The script will upsert users by email and import prescriptions while attempting to resolve patient/doctor references. Inspect logs for any skipped records.  
4. After migration, verify documents in MongoDB Atlas and then you may remove or archive the JSON files (optional).

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
