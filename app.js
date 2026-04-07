// ================= IMPORTS =================

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");


require("dotenv").config();


// ================= MODELS =================

const User = require("./models/user");


// ================= ROUTERS =================

const listingRouter = require("./routers/listing");
const reviewRouter = require("./routers/review");
const userRouter = require("./routers/user");
const bookingRoutes = require("./routers/bookings");
const wishlistRoutes = require("./routers/wishlist");
const aiRoutes = require("./routers/ai");


// ================= VIEW ENGINE =================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);


// ================= BASIC MIDDLEWARE =================

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));


// ================= SECURITY =================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://*.tile.openstreetmap.org"],
        connectSrc: ["'self'", "https://api.opencagedata.com", "https://*.tile.openstreetmap.org"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"]
      }
    }
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP. Please try again later."
});

app.use(limiter);



// ================= DATABASE =================

// Support both local MongoDB and MongoDB Atlas
const dbUrl = process.env.NODE_ENV === "production" 
  ? process.env.ATLAS_URL 
  : (process.env.MONGO_URL || "mongodb://localhost:27017/nestigo");

if (!dbUrl) {
  console.error("❌ DATABASE URL NOT SET!");
  console.error("Set MONGO_URL (local) or ATLAS_URL (production) in .env");
  process.exit(1);
}

console.log(`📊 Connecting to ${process.env.NODE_ENV === "production" ? "MongoDB Atlas (Production)" : "Local MongoDB"}...`);

mongoose
  .connect(dbUrl, {
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed!");
    console.error(err.message);
    if (err.message.includes("authentication") || err.message.includes("ENOTFOUND")) {
      console.error("💡 Tip: Check your connection string and IP whitelist in MongoDB Atlas");
    }
  });

// Monitor connection events
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected");
});


// ================= SESSION =================

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "dev-secret-key",
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: dbUrl,
    crypto: {
      secret: process.env.SESSION_SECRET || "dev-secret-key"
    }
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};
app.use(session(sessionOptions));
app.use(flash());


// ================= PASSPORT =================

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// ================= GLOBAL VARIABLES =================

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  next();
});


// ================= ROUTES =================

app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/bookings", bookingRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/ai", aiRoutes);


// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const { statusCode = 500 } = err;
  if (res.headersSent) {
    return next(err);
  }
  res.status(statusCode).render("error", { err }, (renderErr) => {
    if (renderErr) {
      res.status(statusCode).send(`<h1>Error ${statusCode}</h1><p>${err.message}</p>`);
    }
  });
});


// ================= SERVER =================

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});