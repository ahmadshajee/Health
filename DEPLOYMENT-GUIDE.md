# Deploying Healthcare Management System - Full Stack Guide

## 🚀 FREE Backend Deployment on Render.com

### Prerequisites
- GitHub account with your code pushed
- Render.com account (free - sign up with GitHub)

### Step-by-Step Deployment Guide

## Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with your GitHub account
4. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click **"New +"** button in dashboard
2. Select **"Web Service"**
3. Connect your GitHub repository: `ahmadshajee/Health`
4. Click **"Connect"** next to your repository

### Step 3: Configure Your Service
Fill in these settings:

**Basic Settings:**
- **Name**: `healthcare-backend` (or any name you prefer)
- **Region**: Choose closest to you (e.g., Oregon)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`

**Instance Type:**
- Select **"Free"** plan

### Step 4: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

```
PORT = 5000
NODE_ENV = production
JWT_SECRET = your-super-secret-jwt-key-change-this-to-something-secure-123456
EMAIL_SERVICE = gmail
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-specific-password
```

**Important Notes:**
- Generate a strong JWT_SECRET (at least 32 characters)
- For Gmail, use App Password (not regular password):
  - Go to Google Account → Security → 2-Step Verification → App Passwords
  - Generate a new app password for "Mail"
  - Use that 16-character password

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. You'll get a URL like: `https://healthcare-backend.onrender.com`

### Step 6: Test Your Backend
Once deployed, test these endpoints:

```bash
# Health check
https://healthcare-backend.onrender.com/

# API health
https://healthcare-backend.onrender.com/api/health
```

## Part 2: Update Frontend to Use Deployed Backend

### Step 1: Update API Configuration

Edit `client/src/services/api.ts`:

**Before (Development):**
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

**After (Production):**
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://healthcare-backend.onrender.com/api'  // Replace with YOUR Render URL
  : 'http://localhost:5000/api';
```

### Step 2: Update CORS Settings

Make sure your server allows requests from GitHub Pages.

Edit `server/index.js` CORS configuration:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ahmadshajee.github.io'  // Your GitHub Pages URL
  ],
  credentials: true
}));
```

### Step 3: Rebuild and Deploy Frontend

```bash
# In project root
cd client
npm run build
npm run deploy
```

## Part 3: Alternative Free Hosting Options

### Option A: Railway.app

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `ahmadshajee/Health`
5. Railway auto-detects Node.js
6. Add environment variables in Settings
7. Your backend URL: `https://your-app.railway.app`

### Option B: Cyclic.sh

1. Go to [cyclic.sh](https://cyclic.sh)
2. Click **"Deploy Now"** → Connect GitHub
3. Select repository
4. Configure environment variables
5. Deploy automatically

## Part 4: Full Configuration Example

### Environment Variables Template

Create these on Render dashboard:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=use-a-very-long-random-string-here-min-32-chars

# Email Configuration (Optional for production)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Database (Already using JSON files, no config needed)
```

## Part 5: Testing Your Live Application

### After Deployment:

1. **Backend Health Check:**
   ```
   https://healthcare-backend.onrender.com/
   ```
   Should return: "Healthcare Management System API"

2. **Frontend Access:**
   ```
   https://ahmadshajee.github.io/Health
   ```

3. **Test Login:**
   - Email: `doctor@test.com`
   - Password: `password`

## 🎯 Quick Reference

### Your URLs After Deployment:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://ahmadshajee.github.io/Health | User interface |
| **Backend API** | https://healthcare-backend.onrender.com | API server |
| **GitHub Repo** | https://github.com/ahmadshajee/Health | Source code |

## ⚠️ Important Notes

### Free Tier Limitations:

**Render Free Tier:**
- ✅ Unlimited apps
- ✅ 512MB RAM
- ⚠️ Spins down after 15min inactivity
- ⚠️ Takes ~30 seconds to wake up on first request
- ⚠️ Limited to 750 hours/month

### Best Practices:

1. **Cold Starts**: First request after inactivity takes 30+ seconds
2. **Keep Alive**: Consider using a service like UptimeRobot to ping your backend
3. **Environment Variables**: Never commit sensitive data to GitHub
4. **CORS**: Ensure your backend allows requests from GitHub Pages domain

## 🔧 Troubleshooting

### Backend Not Starting:
- Check environment variables are set correctly
- Review deployment logs on Render dashboard
- Verify `package.json` has correct start script

### Frontend Can't Connect to Backend:
- Check CORS settings allow GitHub Pages domain
- Verify API_BASE_URL in frontend matches backend URL
- Ensure backend is not sleeping (visit URL to wake it)

### Email Notifications Not Working:
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- Use Gmail App Password, not regular password
- Check Gmail security settings

## 📊 Cost Analysis

**Monthly Costs:**
- Frontend (GitHub Pages): **$0** ✅
- Backend (Render Free): **$0** ✅
- Domain (Optional): **~$10-15/year**
- **Total: FREE** 🎉

## 🚀 Next Steps After Deployment

1. ✅ Monitor your backend on Render dashboard
2. ✅ Test all features (login, prescriptions, patient management)
3. ✅ Set up UptimeRobot for keep-alive pings
4. ✅ Share your live application URL
5. ✅ Add deployment status badges to README

---

**Your Healthcare Management System is now live and accessible worldwide! 🌍**