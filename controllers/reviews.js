const Listing = require("../models/listing");
const Review = require("../models/review");
const ExpressError = require("../utils/ExpressError");


// ➕ CREATE REVIEW
module.exports.createReview = async (req, res) => {

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;

    await newReview.save();

    // push review FIRST
    listing.reviews.push(newReview._id);

    const reviews = await Review.find({ _id: { $in: listing.reviews } });

    const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;

    listing.rating = avgRating;

    await listing.save();

    req.flash("success", "Review added!");
    res.redirect(`/listings/${listing._id}`);
};;


// ❌ DELETE REVIEW
module.exports.deleteReview = async (req, res) => {

    const { id, reviewId } = req.params;

    // remove review reference from listing
    await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId }
    });

    // delete review
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review deleted!");
    res.redirect(`/listings/${id}`);
};