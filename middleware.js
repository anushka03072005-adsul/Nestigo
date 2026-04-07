const Listing = require("./models/listing");

const Review = require("./models/review");

module.exports.isReviewAuthor = async (req, res, next) => {

    let { id, reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review.author || !review.author.equals(req.user._id)) {

        req.flash("error", "You don't have permission to delete this review!");
        return res.redirect(`/listings/${id}`);
    }

    next();
};

module.exports.isOwner = async (req, res, next) => {

    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing.owner.equals(req.user._id)) {

        req.flash("error", "You don't have permission to do that!");
        return res.redirect(`/listings/${id}`);
    }

    next();
};


module.exports.isLoggedIn = (req, res, next) => {

    if (!req.isAuthenticated()) {

        console.log("Saving redirect URL:", req.originalUrl);  // ⭐ debug

        req.session.redirectUrl = req.originalUrl;

        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }

    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {

    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }

    next();
};