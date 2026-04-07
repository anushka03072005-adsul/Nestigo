const User = require("../models/user");


// ================= SIGNUP FORM =================
module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup");
};


// ================= SIGNUP =================
module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;

        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);

            req.flash("success", "Welcome to Nestigo!");

            req.session.save((err) => {
                if (err) return next(err);
                res.redirect("/listings");
            });
        });

    } catch (e) {
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
module.exports.login = (req, res) => {

    req.flash("success", `Welcome back ${req.user.username}!`);

    const redirectUrl = res.locals.redirectUrl || "/listings";

    res.redirect(redirectUrl);
};


// ================= LOGOUT =================
module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) return next(err);

        req.flash("success", "Logged out successfully!");
        res.redirect("/listings");
    });
};