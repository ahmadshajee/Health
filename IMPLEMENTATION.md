# Simplified Healthcare Management System

## Project Structure

I've created a full-stack application with the following structure:

### Backend (Node.js + Express)
- JWT Authentication for doctors and patients
- Prescription management API
- Email notification service
- QR code generation
- JSON file-based data storage

### Frontend (React + TypeScript)
- Material UI components
- Role-based routing and permissions
- QR code display and verification
- Responsive design

## Getting Started

1. **Set up environment variables**:
   - Copy `.env.example` to `.env` in the server directory
   - Update with your email service credentials

2. **Install dependencies**:
   ```
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Run the application**:
   ```
   # Start the server (from server directory)
   npm run dev

   # Start the client (from client directory)
   npm start
   ```

## Features Implemented

- Dual-role authentication (Doctors and Patients)
- Digital prescription creation and management
- QR code generation for prescription verification
- Email notifications for patients
- Secure prescription viewing and downloading

## Workflow

1. Doctor logs in to the system
2. Doctor creates a digital prescription
3. Patient receives an email notification
4. Patient views/downloads the prescription
5. QR code verification for prescription authenticity

## Technologies Used

- React with TypeScript
- Node.js with Express
- JWT for authentication
- Material UI for UI components
- QR code generation and display
- JSON file-based data storage
- Nodemailer for email notifications
