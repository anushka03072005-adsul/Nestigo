# CRITICAL ISSUES - QUICK FIX CHECKLIST

## 🚨 SECURITY - FIX IMMEDIATELY

### Issue #1: Exposed API Credentials
**File:** `.env`  
**Severity:** 🔴 CRITICAL  
**Action Required:** ROTATE ALL KEYS NOW
```
Exposed:
- Cloudinary API Key & Secret
- MongoDB Atlas Credentials  
- Geocoding API Key
```
**Fix Steps:**
1. Go to Cloudinary dashboard → regenerate API Key & Secret
2. Go to MongoDB Atlas → reset database user password
3. Go to OpenCage → regenerate API key
4. Update `.env` with new values
5. Add `.env` to `.gitignore`
6. Create `.env.example` template
7. Force push warning to team

---

### Issue #2: Hardcoded Session Secrets
**Files:** `app.js` (Lines 68, 75)  
**Current Code:**
```javascript
secret: "mysupersecretcode",
```
**Fix:**
```javascript
secret: process.env.SESSION_SECRET || "dev-secret",
```
**Add to `.env`:**
```
SESSION_SECRET=<generate-random-string>
```
Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### Issue #3: CSP Disabled
**File:** `app.js` (Line 52)  
**Current:**
```javascript
helmet({
    contentSecurityPolicy: false  // ⚠️ XSS RISK
})
```
**Fix:**
```javascript
helmet({
    contentSecurityPolicy: {
        directives: {
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "*.cloudinary.com", "*.unsplash.com"],
            connectSrc: ["'self'", "api.opencagedata.com"]
        }
    }
})
```

---

## 🚨 LOGIC ERRORS - FIX ASAP

### Issue #4: No Booking Date Validation
**File:** `controllers/bookings.js` (Line 6)  
**Problems:**
- ❌ Can book checkout before checkin
- ❌ Can double-book same dates
- ❌ Can book past dates
- ❌ No minimum stay requirement

**Fix:**
```javascript
module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut } = req.body;
    
    // Validate date logic
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
        req.flash("error", "Cannot book past dates!");
        return res.redirect(`/listings/${id}`);
    }
    
    if (checkOutDate <= checkInDate) {
        req.flash("error", "Check-out must be after check-in!");
        return res.redirect(`/listings/${id}`);
    }
    
    // Check for overlapping bookings
    const conflicting = await Booking.findOne({
        listing: id,
        $or: [
            { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
        ]
    });
    
    if (conflicting) {
        req.flash("error", "These dates are already booked!");
        return res.redirect(`/listings/${id}`);
    }
    
    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate
    });
    
    await newBooking.save();
    
    // ... rest of code
};
```

---

### Issue #5: Geocoding Failures Not Handled
**Files:** 
- `controllers/listing.js` (Lines 158-164 for create, similar for update)

**Current Code:**
```javascript
const geoRes = await axios.get(
    `https://api.opencagedata.com/geocode/v1/json?q=${req.body.listing.location}&key=${process.env.GEOCODING_API_KEY}`
);

const { lat, lng } = geoRes.data.results[0].geometry;
```

**Problems:**
- ❌ No try-catch
- ❌ Crashes if API fails
- ❌ No check for empty results
- ❌ Risk hitting API rate limits (5000/day free)

**Fix:**
```javascript
try {
    const geoRes = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${req.body.listing.location}&key=${process.env.GEOCODING_API_KEY}`
    );

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
        req.flash("error", "Location not found. Please try a different address.");
        return res.redirect(`/listings/${id || ""}`);
    }

    const { lat, lng } = geoRes.data.results[0].geometry;

    newListing.geometry = {
        type: "Point",
        coordinates: [lng, lat]
    };
} catch (error) {
    console.error("Geocoding error:", error.message);
    req.flash("error", "Unable to verify location. Please try again.");
    return res.redirect(`/listings/${id || ""}`);
}
```

---

### Issue #6: Database URL Mismatch (Docker vs App)
**Files:**
- `app.js` Line 63: Uses `ATLAS_URL`
- `docker-compose.yml` Line 20: Overrides with `MONGO_URL`

**Fix in app.js:**
```javascript
// OLD (Line 63):
const dbUrl = process.env.ATLAS_URL;

// NEW:
const dbUrl = process.env.MONGO_URL || process.env.ATLAS_URL;
```

---

## ⚠️ CONFIGURATION ERRORS - FIX SOON

### Issue #7: Cloudinary Typo
**File:** `cloudConfig.js` Line 12  
**Current:**
```javascript
allowerdFormats: ["jpeg", "png", "jpg", "gif","pdf"]
```
**Fix:**
```javascript
allowedFormats: ["jpeg", "png", "jpg", "gif"]  // removed pdf
```

---

### Issue #8: Debug Log Left in Code
**File:** `middleware.js` Line 34  
**Current:**
```javascript
console.log("Saving redirect URL:", req.originalUrl);  // ⭐ debug
```
**Fix:** Remove or move to conditional debug logger
```javascript
if (process.env.DEBUG) {
    console.log("Saving redirect URL:", req.originalUrl);
}
```

---

### Issue #9: init/index.js Bug - Missing Await
**File:** `init/index.js` Line 23  
**Current:**
```javascript
const initDB = async () => {
    await Listing.deleteMany({});
    initilizedata.data    // ← DOES NOTHING!
    await Listing.insertMany(initilizedata.data);
    console.log("Data was initialized");
}
```
**Fix:** Remove the orphaned line
```javascript
const initDB = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initilizedata.data);
    console.log("Data was initialized");
}
```

---

### Issue #10: Missing .env Variables
**File:** `.env`  
**Add these:**
```
PORT=8080
NODE_ENV=development
SESSION_SECRET=<generate-random-string>
GEOCODING_RATE_LIMIT=4000
```

---

## ⚠️ MISSING FEATURES - HIGH PRIORITY

### Missing #1: No Booking View/Cancel Routes
**File:** `routers/bookings.js`  
**Add:**
```javascript
// GET user's bookings
router.get("/", isLoggedIn, bookingController.getUserBookings);

// DELETE/cancel a booking
router.delete("/:bookingId", isLoggedIn, bookingController.cancelBooking);
```

**Add to controllers/bookings.js:**
```javascript
module.exports.getUserBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ checkIn: -1 });
    res.render("bookings/index", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { status: "cancelled" },
        { new: true }
    );
    req.flash("success", "Booking cancelled");
    res.redirect("/bookings");
};
```

---

### Missing #2: Controller Functions Not Used by Router
**File:** `routers/listing.js` - index route  
**Issue:** Router's index() is basic, controller's index() is advanced (search, recommendations)

**Fix:** Update router index to use controller
```javascript
// OLD (router's basic implementation)
router.get("/", async (req, res) => {
    const { category, page = 1 } = req.query;
    // basic code...
});

// NEW (use controller)
router.get("/", wrapAsync(listingController.index));
```

---

## 📋 TESTING CHECKLIST

After fixes, test:
- [ ] Cannot book with checkout <= checkin
- [ ] Cannot book past dates
- [ ] Cannot double-book same dates
- [ ] All API credentials working
- [ ] Session secrets not visible in code
- [ ] Geocoding errors handled gracefully
- [ ] Listings without geometry still load
- [ ] Search functionality works from UI
- [ ] Recommendations show on listings page
- [ ] Cloudinary image upload works
- [ ] Docker compose connects correctly

---

## ENVIRONMENT VARIABLES TEMPLATE

Create `.env` with:
```
# Database
MONGO_URL=mongodb://127.0.0.1:27017/Nestigo
ATLAS_URL=mongodb+srv://user:password@cluster.mongodb.net/?appName=Cluster0

# Cloudinary (regenerate these!)
CLOUD_NAME=<your-cloud-name>
CLOUD_API_KEY=<new-api-key>
CLOUD_API_SECRET=<new-api-secret>

# Geocoding
GEOCODING_API_KEY=<your-api-key>

# Session
SESSION_SECRET=<generate-with-crypto>

# Server
PORT=8080
NODE_ENV=development
```

---

## TIME ESTIMATES

| Task | Time | Priority |
|------|------|----------|
| Rotate credentials | 30 min | 🔴 NOW |
| Fix hardcoded secrets | 15 min | 🔴 NOW |
| Fix booking validation | 45 min | 🔴 TODAY |
| Add error handling | 30 min | 🔴 TODAY |
| Add booking routes | 60 min | 🟠 THIS WEEK |
| Fix router/controller | 30 min | 🟠 THIS WEEK |
| Add email validation | 20 min | 🟠 THIS WEEK |
| **Total Blocking** | **2.5 hours** | |
| **Total Recommended** | **5 hours** | |

