# PROJECT ARCHITECTURE & DEPENDENCIES

## 1. USER JOURNEY FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER FLOWS                                 │
└─────────────────────────────────────────────────────────────────┘

AUTHENTICATION:
   signup.ejs → POST /signup → user.js (signup) → passport → Redis session
   login.ejs  → POST /login  → passport.authenticate → user.js (login)
   logout     → GET /logout  → user.js (logout) → clear session

LISTING BROWSING:
   index.ejs ← GET /listings ← listing.js (index) ← Listing model
     ↓ (search/filter)
   index.ejs ← category filter → search query → Pagination
     ↓ (view details)
   show.ejs ← GET /listings/:id ← listing.js (showListing) 

LISTING MANAGEMENT (Owner):
   new.ejs → POST /listings → multer → Cloudinary → Geocoding API → Listing
   edit.ejs → PUT /listings/:id → same process
   show.ejs → DELETE /listings/:id → Cloudinary cleanup → Listing delete

REVIEWS:
   show.ejs → POST /reviews → review.js (createReview) → Review model
              → Update Listing.rating (average)

BOOKINGS:
   show.ejs → POST /bookings/:id → bookings.js (createBooking) → Booking model
                 ⚠️ MISSING: View, Cancel, Overlap validation

WISHLIST:
   show.ejs → POST /wishlist/:id → wishlist.js (toggleWishlist) → User model

AI RECOMMENDATIONS:
   show.ejs → GET /ai/assistant?query=... → ai.js → recommend by keyword
```

---

## 2. DATA MODELS RELATIONSHIP

```
┌──────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                               │
└──────────────────────────────────────────────────────────────────┘

┌─────────────┐
│    USER     │
├─────────────┤
│ _id         │
│ username    │
│ email       │◄──────────┐
│ password    │           │ (hashed by passport)
│ wishlist[]  │───────────┼──────┐
│ createdAt   │           │      │
│ updatedAt   │           │      │
└─────────────┘           │      │
      ▲                   │      │
      │ (owner)           │      │
      │                   │      │
      │          ┌─────────────────────┐
      │          │    LISTING          │
      │          ├─────────────────────┤
      │          │ _id                 │
      └──────────│ owner: User._id     │
                 │ title               │
                 │ description         │
                 │ price               │
                 │ location            │
                 │ country             │
                 │ category            │
                 │ image (Cloudinary)  │
                 │ geometry (GeoJSON)  │
                 │ views: Number       │
                 │ rating: Number      │
                 │ bookingCount        │
                 │ reviews[]───────────┼──────────┐
                 │ createdAt           │          │
                 └─────────────────────┘          │
                      ▲                           │
                      │                           │
        ┌─────────────────────┐                   │
        │      REVIEW         │                   │
        ├─────────────────────┤                   │
        │ _id                 │                   │
        │ comment             │                   │
        │ rating (1-5)        │                   │
        │ author: User._id    │                   │
        │ createdAt           │                   │
        └─────────────────────┘                   │
        (referenced by LISTING.reviews[])         │
                                                  │
                 ┌──────────────────────┐        │
                 │      BOOKING         │        │
                 ├──────────────────────┤        │
                 │ _id                  │        │
                 │ listing: Listing._id ◄────────┘
                 │ user: User._id       │
                 │ checkIn: Date        │
                 │ checkOut: Date       │
                 │ status: confirmed    │
                 │         cancelled    │
                 │ createdAt            │
                 │ updatedAt            │
                 └──────────────────────┘

┌─────────────────────────┐
│   USER BEHAVIOR         │
├─────────────────────────┤
│ _id                     │
│ user: User._id          │
│ viewedListings[]        │
│ lastCategory: String    │
│ searches: [String]      │
│ bookings: [Booking._id] │
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘
```

---

## 3. REQUEST/RESPONSE FLOW DIAGRAM

```
┌────────────────────────────────────────────────────────────────┐
│                    EXPRESS MIDDLEWARE STACK                     │
└────────────────────────────────────────────────────────────────┘

Client Request
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. SECURITY MIDDLEWARE                                       │
│    • helmet() - CSP headers (disabled - FIX ME!)            │
│    • rateLimit() - 100 req/15min per IP                     │
│    • express.json() / urlencoded()                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SESSION MIDDLEWARE                                        │
│    • express-session (MongoDB store)                         │
│    • passport.initialize()                                   │
│    • passport.session()                                      │
│    • connect-flash()                                         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GLOBAL VARIABLES MIDDLEWARE                              │
│    • res.locals.currUser = req.user                         │
│    • res.locals.success = req.flash("success")              │
│    • res.locals.error = req.flash("error")                  │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ROUTE HANDLERS                                            │
│    ┌──────────────┐                                         │
│    │ /listings    │ → listingRouter                         │
│    ├──────────────┤                                         │
│    │ /reviews     │ → reviewRouter                          │
│    ├──────────────┤                                         │
│    │ /signup      │ → userRouter                            │
│    ├──────────────┤                                         │
│    │ /login       │ → passport.authenticate + userRouter    │
│    ├──────────────┤                                         │
│    │ /logout      │ → userRouter                            │
│    ├──────────────┤                                         │
│    │ /bookings    │ → bookingsRouter                        │
│    ├──────────────┤                                         │
│    │ /wishlist    │ → wishlistRouter                        │
│    ├──────────────┤                                         │
│    │ /ai          │ → aiRouter                              │
│    └──────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CONTROLLER LOGIC                                          │
│    • Validation (Joi)                                        │
│    • Database queries (Mongoose)                            │
│    • External API calls (Cloudinary, Geocoding)             │
│    • Business logic                                         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. EJS TEMPLATE RENDERING                                    │
│    ↓ res.render("view", { data })                           │
│    ↓ boilerplate.ejs (master template)                      │
│    ├─ navbar.ejs (included)                                 │
│    ├─ specific page (index/show/new/edit)                   │
│    ├─ flash.ejs (included)                                  │
│    └─ footer.ejs (included)                                 │
└─────────────────────────────────────────────────────────────┘
    ↓
  Response
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. ERROR HANDLING (if error thrown)                          │
│    • wrapAsync catches promise rejections                   │
│    • ExpressError with statusCode                           │
│    • Global error handler renders error.ejs                 │
│    • Fallback HTML if EJS fails                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. EXTERNAL INTEGRATIONS

```
┌──────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES INTEGRATION                     │
└──────────────────────────────────────────────────────────────┘

CLOUDINARY (Image Storage)
    ↑↓ HTTP/HTTPS
  app.js, listing.js, seedImages.js, addGeometry.js
    │
    ├─ Upload: JPEG, PNG, JPG, GIF (PDF ignored due to typo)
    ├─ Storage: /Nestigo folder
    ├─ Credentials: CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET
    └─ Usage: 
        • User uploads listing image → multer → Cloudinary
        • Multiple listings upload → seedImages.js

OPEN CAGE GEOCODING API
    ↑↓ HTTP/HTTPS
  listing.js (create, update), addGeometry.js
    │
    ├─ Input: Location string
    ├─ Output: { lat, lng } coordinates
    ├─ Credentials: GEOCODING_API_KEY
    ├─ Usage:
    │   • Create listing → geocode location → store geometry
    │   • Update listing → re-geocode new location
    │   • Batch script → geocode all existing listings
    └─ ⚠️ ISSUES:
        • No error handling if API fails
        • No rate limiting check (5000 req/day free)
        • Invalid addresses crash the app

MONGODB ATLAS (Database)
    ↑↓ TCP 27017
  mongoose connection
    │
    ├─ Collections:
    │   • users
    │   • listings
    │   • reviews
    │   • bookings
    │   • userbehaviors
    │   • sessions
    ├─ Credentials: ATLAS_URL user & password
    └─ Status: ✅ Connected in production

LOCAL MONGODB (Dev)
    ↑↓ TCP 27017
  mongoose connection
    │
    ├─ URL: mongodb://127.0.0.1:27017/Nestigo
    └─ Status: ⚠️ Requires local MongoDB running

SESSION STORAGE (MongoDB)
    ↑↓ MongoDB
  express-session + connect-mongo
    │
    ├─ Stores encrypted sessions
    ├─ Secret key: "mysupersecretcode" ⚠️ HARDCODED
    └─ Duration: 7 days (604800000 ms)

MULTER (File Upload Handling)
    ↑↓ Disk/Cloudinary
  File uploads
    │
    ├─ Storage: CloudinaryStorage
    ├─ Upload middleware: upload.single("listingImage")
    └─ Used in: POST /listings, PUT /listings/:id

PASSPORT LOCAL (Authentication)
    ↑↓ Hash/Crypto
  User login/signup
    │
    ├─ Strategy: LocalStrategy
    ├─ Plugin: passport-local-mongoose
    ├─ Hash: bcrypt (via plugin)
    └─ Used in: /signup, /login routes
```

---

## 5. FILE DEPENDENCIES MAP

```
┌────────────────────────────────────────────────────────────┐
│                  DEPENDENCY IMPORTS                         │
└────────────────────────────────────────────────────────────┘

app.js
  ├─ express
  ├─ mongoose
  ├─ passport
  ├─ express-session
  ├─ connect-mongo
  ├─ helmet
  ├─ express-rate-limit
  ├─ connect-flash
  ├─ ejs-mate
  ├─ dotenv
  ├─ models/user.js
  ├─ routers/:
  │  ├─ listing.js
  │  ├─ review.js
  │  ├─ user.js
  │  ├─ bookings.js
  │  ├─ wishlist.js
  │  └─ ai.js
  └─ controllers/: (loaded by routers)

middleware.js
  ├─ models/listing.js
  └─ models/review.js

cloudConfig.js
  ├─ cloudinary
  └─ multer-storage-cloudinary

controllers/listing.js
  ├─ models/listing.js
  ├─ models/booking.js
  ├─ models/UserBehavior.js
  ├─ utils/ExpressError.js
  ├─ cloudConfig.js (cloudinary)
  ├─ axios (HTTP)
  └─ fs (file system)

controllers/reviews.js
  ├─ models/listing.js
  ├─ models/review.js
  └─ utils/ExpressError.js

controllers/bookings.js
  ├─ models/booking.js
  ├─ models/listing.js
  └─ models/UserBehavior.js

controllers/user.js
  └─ models/user.js

controllers/wishlist.js
  └─ models/user.js

controllers/ai.js
  └─ models/listing.js

routers/listing.js
  ├─ models/listing.js
  ├─ utils/wrapAsync.js
  ├─ utils/ExpressError.js
  ├─ schema.js
  ├─ middleware.js
  ├─ controllers/listing.js
  ├─ multer
  └─ cloudConfig.js

routers/review.js
  ├─ middleware.js
  ├─ utils/wrapAsync.js
  ├─ utils/ExpressError.js
  ├─ schema.js
  └─ controllers/reviews.js

routers/user.js
  ├─ passport
  ├─ middleware.js
  └─ controllers/user.js

routers/bookings.js
  ├─ middleware.js
  └─ controllers/bookings.js

routers/wishlist.js
  ├─ middleware.js
  └─ controllers/wishlist.js

routers/ai.js
  └─ controllers/ai.js

models/user.js
  └─ passport-local-mongoose

models/listing.js
  ├─ mongoose
  └─ models/review.js (for post-hook)

models/review.js
  └─ mongoose

models/booking.js
  └─ mongoose

models/UserBehavior.js
  └─ mongoose

utils/ExpressError.js
  └─ (extends Error)

utils/wrapAsync.js
  └─ (utility function)

init/index.js
  ├─ mongoose
  └─ init/data.js

addGeometry.js
  ├─ mongoose
  ├─ models/listing.js
  └─ axios

seedImages.js
  ├─ mongoose
  ├─ models/listing.js
  └─ cloudConfig.js
```

---

## 6. FEATURE COMPLETION MATRIX

```
┌──────────────────────────────────────────────────────────┐
│                 FEATURE STATUS                            │
└──────────────────────────────────────────────────────────┘

AUTHENTICATION
  ✅ Register user
  ✅ Login with Passport
  ✅ Logout
  ✅ Session management
  ❌ Email verification
  ❌ Password reset
  ❌ Social login (Google/FB)
  ❌ Two-factor authentication

LISTINGS (CRUD)
  ✅ Create listing
  ✅ Read/Browse listings
  ✅ Update listing
  ✅ Delete listing
  ✅ Category filtering
  ✅ Search functionality (in controller)
  ❌ Search in UI (router doesn't use it)
  ✅ Image upload to Cloudinary
  ✅ Geolocation (OpenCage)
  ⚠️  Map display (geometry stored but not used)

REVIEWS
  ✅ Create review
  ✅ Read reviews
  ✅ Delete review (auth-protected)
  ❌ Edit review
  ✅ Rating calculation
  ✅ Author tracking

BOOKINGS
  ✅ Create booking
  ⚠️  No date validation
  ⚠️  No overlap checking
  ❌ View user bookings
  ❌ Cancel booking
  ❌ Booking history

WISHLIST
  ✅ Add/remove favorite
  ✅ View wishlist
  ❌ Share wishlist
  ❌ Wishlist notifications

RECOMMENDATIONS
  ✅ Trending listings (views + bookings)
  ✅ Category recommendations
  ✅ User behavior tracking
  ⚠️  AI recommendations (keyword-based, not ML)
  ❌ Personalized recommendations (basic algorithm)

ADMIN PANEL
  ❌ Moderation tools
  ❌ User management
  ❌ Listing moderation
  ❌ Analytics dashboard

PERFORMANCE
  ✅ Text index for search
  ❌ Redis caching
  ❌ Query optimization
  ✅ Pagination
  ✅ Rate limiting
  ❌ Image optimization/CDN caching

SECURITY
  ⚠️  Session secrets (hardcoded)
  🚨 Exposed API credentials
  ⚠️  CSP disabled
  ✅ Input validation (Joi)
  ✅ SQL injection protection (Mongoose)
  ✅ XSS protection (EJS auto-escaping)
  ✅ CSRF protection (method-override)
  ✅ Rate limiting
  ✅ Helmet security headers
```

---

## 7. CONFIGURATION MATRIX

```
┌──────────────────────────────────────────────────────────┐
│              ENVIRONMENT VARIABLES REQUIRED                │
└──────────────────────────────────────────────────────────┘

DATABASE:
  ✅ MONGO_URL              (local dev)
  ✅ ATLAS_URL              (production)
  ⚠️  Using ATLAS_URL in app but MONGO_URL in docker

CLOUDINARY:
  🚨 CLOUD_NAME             (EXPOSED)
  🚨 CLOUD_API_KEY          (EXPOSED - ROTATE!)
  🚨 CLOUD_API_SECRET       (EXPOSED - ROTATE!)

GEOCODING:
  🚨 GEOCODING_API_KEY      (EXPOSED - ROTATE!)

SESSION:
  🚨 SESSION_SECRET         (HARDCODED, not in .env)

SERVER:
  ❌ PORT                   (hardcoded to 8080)
  ❌ NODE_ENV               (not set)
  ❌ DEBUG                  (not set)

MISSING:
  ❌ REDIS_URL              (caching)
  ❌ LOG_LEVEL              (logging)
  ❌ MAIL_SERVICE           (email verification)
  ❌ JWT_SECRET             (if using JWT)
  ❌ CORS_ORIGIN            (API security)
```

---

## 8. API ENDPOINTS SUMMARY

```
┌──────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                          │
└──────────────────────────────────────────────────────────┘

LISTINGS:
  GET    /listings                    → all listings (paginated)
  GET    /listings/:id                → single listing details
  GET    /listings/new                → new listing form (protected)
  POST   /listings                    → create listing (protected)
  GET    /listings/:id/edit           → edit form (protected)
  PUT    /listings/:id                → update listing (protected)
  DELETE /listings/:id                → delete listing (protected)

REVIEWS:
  POST   /listings/:id/reviews        → create review (protected)
  DELETE /listings/:id/reviews/:reviewId → delete review (protected)

BOOKINGS:
  POST   /bookings/:id                → create booking (protected)
  ❌ GET    /bookings                  (MISSING)
  ❌ DELETE /bookings/:bookingId       (MISSING)

WISHLIST:
  POST   /wishlist/:id                → toggle wishlist (protected)
  GET    /wishlist                    → view wishlist (protected)

USER:
  GET    /signup                      → signup form
  POST   /signup                      → register user
  GET    /login                       → login form
  POST   /login                       → authenticate user
  GET    /logout                      → logout user

AI:
  GET    /ai/assistant?query=...      → get recommendations

STATIC:
  GET    /uploads/*                   → uploaded files
  GET    /css/*                       → stylesheets
  GET    /js/*                        → JavaScript files
```

---

## SUMMARY TABLE

| Layer | Status | Issues | Score |
|-------|--------|--------|-------|
| **Security** | 🚨 Critical | Exposed credentials, hardcoded secrets | 3/10 |
| **Architecture** | ✅ Good | Clean MVC, proper separation | 8/10 |
| **Database** | ✅ Good | Well-modeled, proper refs | 8/10 |
| **Routes** | ⚠️ Mixed | Routes exist but UI missing features | 6/10 |
| **Controllers** | ⚠️ Mixed | Logic exists but no error handling | 6/10 |
| **Validation** | ⚠️ Partial | Joi schema exists, business logic missing | 5/10 |
| **Error Handling** | ⚠️ Partial | Global handler exists, missing in APIs | 5/10 |
| **Features** | ✅ Good | Core features working, some missing | 7/10 |
| **Configuration** | ⚠️ Issues | Mismatches and typos | 4/10 |
| **Documentation** | ❌ None | No comments or API docs | 1/10 |
| **Testing** | ❌ None | No unit/integration tests | 0/10 |
| **OVERALL** | ⚠️ MEDIUM | Fix security before production | **5.3/10** |

