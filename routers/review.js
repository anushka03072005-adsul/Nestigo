const express = require("express");
const router = express.Router({ mergeParams: true });

const { isLoggedIn, isReviewAuthor } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const { reviewSchema } = require("../schema.js");
const reviewController = require("../controllers/reviews");


// ⭐ Validation Middleware
const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};


// ➕ CREATE REVIEW
router.post("/",
    isLoggedIn,
    validateReview,
    wrapAsync(reviewController.createReview)
);


// ❌ DELETE REVIEW
router.delete("/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.deleteReview)
);

module.exports = router;