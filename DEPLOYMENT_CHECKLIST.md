# 🚀 Nestigo Deployment to Firebase - Quick Start

## Your Project Details
```
Project Name: Nestigo
Project ID: nestigo-ea05d
Database: MongoDB Atlas ✅
```

---

## ✅ COMPLETED STEPS

✅ **1. MongoDB Atlas Setup**
- Database: `cluster0.kgfbgnp.mongodb.net`
- Username: `anushkaadsul2005_db_user`
- Connection: Active & Seeded with 29 listings

✅ **2. Environment Configuration**
- `NODE_ENV=production` set
- ATLAS_URL configured in `.env`
- App exports properly for Cloud Functions

✅ **3. Firebase Project Created**
- Project ID: `nestigo-ea05d`
- Console: https://console.firebase.google.com/u/0/project/nestigo-ea05d

---

## 📋 NEXT STEPS TO DEPLOY

### Step 1: Authenticate with Firebase

```bash
npx firebase login
```

Follow the browser prompt to sign in with your Google account.

### Step 2: Initialize Firebase (One-time)

```bash
npx firebase init
```

When prompted:
- Select: **Hosting** (space to toggle, enter to confirm)
- Use existing project: **nestigo-ea05d**
- What do you want to use as your public directory: **public**
- Configure as a single-page app: **No**
- Set up automatic builds: **No**

### Step 3: Deploy to Firebase

```bash
npx firebase deploy
```

This will:
- Deploy your app to Firebase Hosting
- Use MongoDB Atlas for data
- Display your live URL

### Step 4: Your Live App

Once deployed, visit:
```
https://nestigo-ea05d.web.app
```

---

## 🔧 Environment Variables at Hosting

If Firebase asks about environment variables during deployment, set these in Firebase Console:

1. Go to: https://console.firebase.google.com/u/0/project/nestigo-ea05d
2. Go to: **Hosting** → **Functions** (or **Cloud Functions**)
3. Set these env vars for your deployed function:

```
NODE_ENV=production
ATLAS_URL=mongodb+srv://anushkaadsul2005_db_user:d5qCNUcmd5UzGjAC@cluster0.kgfbgnp.mongodb.net/?appName=Cluster0
CLOUD_NAME=dlvcwroow
CLOUD_API_KEY=372361599256125
CLOUD_API_SECRET=buFfOvsuyW7ixu-tTw4KlP9EjyI
GEOCODING_API_KEY=3ad781ffc76c44dc82b726834c4193bb
SESSION_SECRET=your-secure-session-secret-here
```

---

## ✨ Deployment Checklist

- [ ] `firebase-tools` installed (`npm install firebase-tools --save-dev`)
- [ ] Logged in to Firebase (`npx firebase login`)
- [ ] `.firebaserc` configured
- [ ] `firebase.json` configured
- [ ] `app.js` exports the Express app
- [ ] Environment variables set
- [ ] Ran `npx firebase deploy`
- [ ] App running at `https://nestigo-ea05d.web.app`

---

## 🧪 Test After Deployment

Once live, test these features:

1. **Listings Page**: https://nestigo-ea05d.web.app/listings
2. **AI Assistant**: Click 🤖 Ask Nestigo AI, try searching "beach"
3. **Maps**: Click any listing → map should display location
4. **Booking**: Click "Book Now" and try booking
5. **Authentication**: Login/Signup page
6. **Wishlist**: Add listings to wishlist

---

## 📊 Monitor Deployment

View logs:
```bash
npx firebase functions:log
```

Or check Firebase Console:
https://console.firebase.google.com/u/0/project/nestigo-ea05d/hosting

---

## 🆘 Common Issues & Solutions

**Issue:** "Cannot find module 'app.js'"
```
Solution: Make sure app.js exports the app at the bottom:
module.exports = app;
```

**Issue:** Database connection timeout
```
Solution: Check MongoDB Atlas IP whitelist includes your Firebase region's IP
```

**Issue:** 404 errors on routes
```
Solution: Check firebase.json rewrites configuration
```

**Issue:** Environment variables not loading
```
Solution: Set them in Firebase Console → Project Settings → Environment Variables
```

---

## 🎉 Success!

Once deployed:
- Your app is live at: https://nestigo-ea05d.web.app
- Data synced to MongoDB Atlas
- All features working globally!

Questions? Check:
- Firebase Docs: https://firebase.google.com/docs/hosting
- MongoDB Atlas Docs: https://www.mongodb.com/docs/atlas
