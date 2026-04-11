const express = require("express");
const router = express.Router();
const passport = require("passport");

const userController = require("../controllers/user");
const { isLoggedIn, saveRedirectUrl } = require("../middleware");

router.get("/wishlist", isLoggedIn, userController.wishlist);

// ================= SIGNUP =================
router.get("/signup",
    userController.renderSignupForm
);

router.post("/signup",
    userController.signup
);


// ================= LOGIN =================
router.get("/login",
    userController.renderLoginForm
);

router.post(
  "/login",
  saveRedirectUrl,
  (req, res, next) => {
    console.log("🔐 LOGIN ATTEMPT:", { username: req.body.username, hasPassword: !!req.body.password });
    next();
  },
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
  }),
  (req, res, next) => {
    console.log("✅ PASSPORT AUTHENTICATED:", { userId: req.user?._id, username: req.user?.username });
    next();
  },
  userController.login
);


// ================= LOGOUT =================
router.get("/logout",
    userController.logout
);

module.exports = router;