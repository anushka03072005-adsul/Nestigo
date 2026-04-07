# Firebase Deployment Guide for Nestigo

## ✅ Prerequisite Checklist

- [x] MongoDB Atlas database configured
- [x] Data migrated to MongoDB Atlas  
- [x] Firebase project created (nestigo-ea05d)
- [ ] Firebase CLI installed globally
- [ ] Authenticated with Firebase
- [ ] Build directory configured

---

## 📥 Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

---

## 🔐 Step 2: Authenticate with Firebase

```bash
firebase login
```

This will open a browser window. Sign in with your Google account (the one associated with Firebase project),
then return to the terminal.

---

## ⚙️ Step 3: Verify Firebase Configuration

```bash
firebase projects:list
```

You should see your project listed:
```
nestigo-ea05d*
```

---

## 🏗️ Step 4: Build Your Project

Since this is an **Express.js app**, Firebase Hosting + Cloud Functions is the best approach.

### Option A: Using Cloud Functions (Recommended for Express)

Firebase Cloud Functions can run your Express server. First, install Firebase Functions SDK:

```bash
npm install --save firebase-functions firebase-admin
```

Create a `functions` directory:
```bash
mkdir functions
cd functions
npm init -y
npm install express --save
```

Then create `functions/index.js`:
```javascript
const functions = require('firebase-functions');
const app = require('../app.js');

exports.app = functions.https.onRequest(app);
```

Update `firebase.json`:
```json
{
  "hosting": {
    "public": "public",
    "rewrites": [
      {
        "source": "**",
        "destination": "/app"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "node18"
  }
}
```

---

### Option B: Traditional Hosting (Static Files Only)

If you only want to host static assets, build your frontend:

```bash
npm run build
```

---

## 🚀 Step 5: Deploy to Firebase

### For Cloud Functions (Express App):

```bash
firebase deploy
```

This will:
- Deploy Cloud Functions with your Express app
- Deploy any static files in the `public` directory
- Output your live URL

### Check Deployment Status:

```bash
firebase projects:list
```

Your app will be available at:
```
https://nestigo-ea05d.web.app
```

---

## 🔍 Step 6: Verify Deployment

Visit your live app:
```
https://nestigo-ea05d.web.app/listings
```

Test these features:
- ✅ Listings load from MongoDB Atlas
- ✅ AI Assistant works
- ✅ Maps display
- ✅ Bookings work
- ✅ User authentication works

---

## 📊 Step 7: Monitor Firebase Logs

View real-time logs:
```bash
firebase functions:log
```

Or visit Firebase Console:
```
https://console.firebase.google.com/u/0/project/nestigo-ea05d
```

---

## 🆘 Troubleshooting

### Issue: "Cannot find module 'app.js'"
**Solution:** Make sure your main `app.js` exports the Express app:
```javascript
module.exports = app;
```

### Issue: "Database connection timeout"
**Solution:** Ensure MongoDB Atlas IP whitelist includes Firebase's IP range:
1. Go to MongoDB Atlas Console
2. Network Access → Add IP Address
3. Add `0.0.0.0/0` (or specific Firebase IP if you find it)

### Issue: "Function fails to deploy"
**Solution:** Check `npm run build` output and ensure no TypeScript/build errors

### Issue: "CORS errors from frontend"
**Solution:** Add Firebase domain to CORS headers in app.js:
```javascript
app.use(cors({
  origin: ["https://nestigo-ea05d.web.app", "http://localhost:3000"]
}));
```

---

## 🔄 Redeploying After Changes

```bash
git add .
git commit -m "Update app"
firebase deploy
```

---

## 📱 Environment Variables in Firebase

Add production environment variables in Firebase Console:
1. Go to Cloud Functions settings
2. Set environment variables for production
3. Add: `MONGODB_ATLAS_URL`, `CLOUDINARY_API_KEY`, etc.

Or use `.env.production`:
```
NODE_ENV=production
ATLAS_URL=mongodb+srv://...
```

---

## ✅ Post-Deployment Checklist

- [ ] All pages loading correctly
- [ ] Database queries working
- [ ] API endpoints responding
- [ ] Maps displaying
- [ ] Authentication working
- [ ] File uploads working
- [ ] Error pages showing properly

---

## 🎉 Success!

Your Nestigo app is now live on Firebase! 

**Live URL:** https://nestigo-ea05d.web.app
**MongoDB:** MongoDB Atlas (production)
**Project ID:** nestigo-ea05d

Questions? Check Firebase Docs: https://firebase.google.com/docs/hosting
