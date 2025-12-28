# Render Deployment Setup

## Environment Variables Required

Your Render backend service needs these environment variables:

### Required Variables

1. **MONGO_URI** (CRITICAL - Missing on your deployment)
   ```
   mongodb+srv://aceplayer547_db_user:x7nKIlcR19L2I1ID@cluster0.5bapsll.mongodb.net/healthcare?retryWrites=true&w=majority&appName=Cluster0
   ```

2. **JWT_SECRET**
   ```
   healthcare_management_secret_key_2025
   ```

3. **PORT**
   ```
   5000
   ```

4. **NODE_ENV**
   ```
   production
   ```

### Optional Variables (for email notifications)

5. **EMAIL_SERVICE**
   ```
   gmail
   ```

6. **EMAIL_USER**
   ```
   your-email@gmail.com
   ```

7. **EMAIL_PASSWORD**
   ```
   your-app-password
   ```

## How to Add Environment Variables on Render

1. Go to https://dashboard.render.com
2. Select your `healthcare-backend` service
3. Click on **Environment** in the left sidebar
4. Click **Add Environment Variable** button
5. Add each variable with Key and Value
6. Click **Save Changes**
7. Render will automatically redeploy your service

## Verify Deployment

After adding `MONGO_URI`, check the health endpoint:

```bash
curl https://health-8zum.onrender.com/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-12-24T...",
  "storage": "mongodb",
  "mongoUriConfigured": true
}
```

If `storage` is still `"json"`, check Render logs for connection errors.

## Current Status

- ✅ Backend is running on Render
- ✅ MongoDB URI is configured locally
- ❌ MongoDB URI is NOT set on Render (causing JSON fallback)
- ✅ New registrations work (JSON storage working as fallback)
- ❌ Prescriptions fail to load (no data in JSON storage on Render)

## Solution

Set `MONGO_URI` environment variable on Render to enable MongoDB storage across deployments.
