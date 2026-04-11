const User = require("../models/user");
const bcrypt = require("bcryptjs");


// ================= SIGNUP FORM =================
module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup");
};


// ================= SIGNUP =================
module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        
        console.log("🔐 SIGNUP ATTEMPT:", { username, email, passwordLength: password?.length });

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log("❌ USER ALREADY EXISTS:", username);
            req.flash("error", "Username already exists!");
            return res.redirect("/signup");
        }

        // Create new user with bcryptjs (password will be hashed by pre-save hook)
        const newUser = new User({ username, email, password });
        console.log("📝 New user created (not saved yet):", newUser.username);
        
        // Save to database (pre-save hook will hash the password)
        const registeredUser = await newUser.save();
        console.log("✅ USER REGISTERED:", { id: registeredUser._id, username: registeredUser.username });

        // Auto-login after signup
        req.login(registeredUser, (err) => {
            if (err) {
                console.error("❌ LOGIN ERROR AFTER SIGNUP:", err.message);
                req.flash("error", "Login failed after signup");
                return res.redirect("/signup");
            }

            console.log("✅ AUTO-LOGIN AFTER SIGNUP SUCCESSFUL");
            req.flash("success", "Welcome to Nestigo!");

            req.session.save((err) => {
                if (err) {
                    console.error("❌ SESSION SAVE ERROR:", err.message);
                    req.flash("error", "Session error");
                    return res.redirect("/signup");
                }
                console.log("✅ SESSION SAVED");
                res.redirect("/listings");
            });
        });

    } catch (e) {
        console.error("❌ SIGNUP ERROR:", e.message);
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};
//============WISHLIST=============
module.exports.wishlist = async (req, res) => {

  const user = await User.findById(req.user._id)
  .populate("wishlist");

  res.render("users/wishlist", { listings: user.wishlist });

};

// ================= LOGIN FORM =================
module.exports.renderLoginForm = (req, res) => {
    res.render("users/login");
};


// ================= LOGIN =================
module.exports.login = (req, res, next) => {
    console.log("🔐 LOGIN SUCCESS:", { 
        userId: req.user?._id, 
        username: req.user?.username,
        isAuthenticated: req.isAuthenticated() 
    });

    req.flash("success", `Welcome back ${req.user.username}!`);

    const redirectUrl = res.locals.redirectUrl || "/listings";
    console.log("📍 REDIRECTING TO:", redirectUrl);

    // CRITICAL: Save session before redirect (same as signup)
    req.session.save((err) => {
        if (err) {
            console.error("❌ SESSION SAVE ERROR:", err);
            return next(err);
        }
        console.log("✅ SESSION SAVED AFTER LOGIN");
        res.redirect(redirectUrl);
    });
};


// ================= LOGOUT =================
module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) return next(err);

        req.flash("success", "Logged out successfully!");
        res.redirect("/listings");
    });
};