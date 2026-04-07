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
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
  }),
  userController.login
);


// ================= LOGOUT =================
router.get("/logout",
    userController.logout
);

module.exports = router;