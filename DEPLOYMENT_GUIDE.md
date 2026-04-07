# 🚀 DEPLOYMENT GUIDE - Firebase & MongoDB Atlas

## Overview
This guide walks you through deploying **Nestigo** to Firebase Hosting with MongoDB Atlas as the database.

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables in `.env` are set
- [ ] Session secret is generated and added to `.env`
- [ ] `.gitignore` contains `.env` 
- [ ] All API keys are rotated (Cloudinary, Geocoding, MongoDB)
- [ ] `package.json` has a "start" script
- [ ] MongoDB Atlas cluster is running
- [ ] Firebase project is created

---

## 📋 Step 1: Prepare Your Environment

### 1.1 Generate Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy output and add to `.env`:
```
SESSION_SECRET=your-generated-secret-here
```

### 1.2 Verify .env file
```bash
cat .env
```
Should contain (without actual values exposed):
- `NODE_ENV=production`
- `SESSION_SECRET=<random-string>`
- `ATLAS_URL=mongodb+srv://...`
- `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`
- `GEOCODING_API_KEY`
- `FIREBASE_API_KEY`, etc.

### 1.3 Test locally
```bash
npm install
NODE_ENV=production npm start
```
Verify all routes work correctly.

---

## 🔥 Step 2: Firebase Setup

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name it (e.g., "Nestigo")
4. Uncheck "Enable Google Analytics" (optional)
5. Create project

### 2.2 Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "</>" (Web)
4. Register app
5. Copy the config object

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "nestigo-xxxxx.firebaseapp.com",
  projectId: "nestigo-xxxxx",
  storageBucket: "nestigo-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

### 2.3 Add to .env
```
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=nestigo-xxxxx.firebaseapp.com
FIREBASE_PROJECT_ID=nestigo-xxxxx
FIREBASE_STORAGE_BUCKET=nestigo-xxxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef...
```

---

## 📦 Step 3: Install Firebase CLI & Deploy

### 3.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 3.2 Login to Firebase
```bash
firebase login
```
(Opens browser for authentication)

### 3.3 Initialize Firebase in your project
```bash
firebase init
```

When prompted:
- **Hosting**: Select Yes (↓ arrow, spacebar)
- **Realtime Database**: Select No (unless you need it)
- **Firestore**: Select No (unless you need it)
- **Project**: Select your Firebase project
- **Public directory**: Type `public`
- **Single-page app**: Type `N`
- **Overwrite**: Type `N`

### 3.4 Create .firebaserc (if needed)
```json
{
  "projects": {
    "default": "nestigo-xxxxx"
  }
}
```

---

## 🌐 Step 4: Build for Production

### 4.1 Update package.json
Make sure you have:
```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

### 4.2 Build
```bash
npm install --production
NODE_ENV=production npm start
```

---

## 🚢 Step 5: Deploy Options

### **OPTION A: Firebase Hosting (Frontend Only)**
Best for static sites. For your Node.js backend, use Firebase Cloud Functions instead.

### **OPTION B: Firebase Cloud Functions (Recommended)**

#### 4.1 Install Functions SDK
```bash
npm install -g firebase-tools
firebase init functions
```

#### 4.2 Convert app.js to function
Create `functions/index.js`:
```javascript
const functions = require('firebase-functions');
const app = require('../app');

exports.api = functions.https.onRequest(app);
```

#### 4.3 Deploy
```bash
firebase deploy --only functions,hosting
```

### **OPTION C: Google Cloud Run (Best for Node.js)**

#### 4.1 Create Dockerfile (already exists)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
EXPOSE 8080
CMD ["node", "app.js"]
```

#### 4.2 Deploy to Cloud Run
```bash
gcloud run deploy nestigo \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="ATLAS_URL=mongodb+srv://...,SESSION_SECRET=..."
```

### **OPTION D: Heroku (Easiest)**

#### 4.1 Install Heroku CLI
```bash
npm install -g heroku
heroku login
```

#### 4.2 Create app
```bash
heroku create nestigo
```

#### 4.3 Add environment variables
```bash
heroku config:set SESSION_SECRET=your-secret
heroku config:set ATLAS_URL=your-mongo-url
heroku config:set CLOUD_NAME=your-cloudinary-name
heroku config:set CLOUD_API_KEY=your-key
heroku config:set CLOUD_API_SECRET=your-secret
heroku config:set GEOCODING_API_KEY=your-key
```

#### 4.4 Deploy
```bash
git push heroku main
```

---

## 🗄️ MongoDB Atlas Setup

### 5.1 Create Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create Organization & Project
3. Build a Cluster (Free M0 tier)
4. Choose Cloud Provider & Region

### 5.2 Create Database User
1. Go to "Database Access"
2. Add Database User
3. Save username & auto-generated password

### 5.3 Whitelist IP
1. Go to "Network Access"
2. Add IP Address
3. For Firebase: Add `0.0.0.0/0` (all IPs) with warning
4. For Cloud Run: Add Cloud Run public IP

### 5.4 Get Connection String
1. Go to "Clusters" → "Connect"
2. Choose "Connect your application"
3. Copy **Node.js** connection string
4. Replace `<username>:<password>` with actual values
5. Add to `.env` as `ATLAS_URL`

Example:
```
ATLAS_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nestigo?retryWrites=true&w=majority
```

---

## 🧪 Step 6: Test Deployment

### 6.1 Local testing
```bash
NODE_ENV=production npm start
```
Visit `http://localhost:8080`

### 6.2 Test critical features
- [ ] Sign up & Login
- [ ] Create listing
- [ ] Search listings
- [ ] Make a booking
- [ ] Image upload (Cloudinary)
- [ ] Location geocoding

### 6.3 Check logs
```bash
firebase functions:log
# OR
heroku logs --tail
# OR
gcloud run logs read nestigo --limit 50
```

---

## 🔒 Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] All API keys are in environment variables (not hardcoded)
- [ ] Session secret is securely generated
- [ ] Database user has minimal privileges
- [ ] HTTPS is enforced
- [ ] CSP headers are properly configured
- [ ] Rate limiting is enabled
- [ ] CORS is configured if needed

---

## 📊 Monitoring

### Firebase
```bash
firebase functions:log
firebase hosting:channel:list
```

### Heroku
```bash
heroku logs --tail
heroku metrics
heroku ps
```

### Google Cloud
```bash
gcloud run services list
gcloud logging read "resource.type=cloud_run_revision"
```

---

## 🐛 Troubleshooting

### Database Connection Fails
```bash
# Verify connection string
mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nestigo"

# Check IP whitelist in Atlas
# Check credentials are correct
```

### Images Not Loading
```bash
# Verify Cloudinary settings
# Check CSP headers allow Cloudinary URLs
# Verify image upload permissions
```

### Geocoding Fails
```bash
# Check API key is valid
# Verify locations are proper addresses
# Check rate limit hasn't been exceeded
# Add better error messages in logs
```

### Session Persists Issues
```bash
# Verify MongoStore is connected
# Check SESSION_SECRET is set
# Verify cookie settings for your domain
```

---

## 📚 Useful Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Heroku Node.js Docs](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Last Updated:** April 2026  
**Status:** Ready for Deployment ✅
