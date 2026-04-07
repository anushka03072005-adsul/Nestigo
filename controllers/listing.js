const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const fs = require("fs");
const path = require("path");
const { cloudinary } = require("../cloudConfig");
const axios = require("axios");
const Booking = require("../models/booking");
const UserBehavior = require("../models/UserBehavior");

// INDEX
module.exports.index = async (req, res) => {

  let { category, search } = req.query;

  let filter = {};

  // ⭐ Category filter
  if (category) {
    filter.category = category;
  }

  // ⭐ Search filter
 if (search) {

const keywords = search.toLowerCase().split(" ");

filter.$or = [

{ title: { $regex: keywords.join("|"), $options: "i" } },

{ location: { $regex: keywords.join("|"), $options: "i" } },

{ country: { $regex: keywords.join("|"), $options: "i" } },

{ category: { $regex: keywords.join("|"), $options: "i" } }

];

}
  // ⭐ Track user behaviour
  if (req.user) {

    let behavior = await UserBehavior.findOne({ user: req.user._id });

    if (!behavior) {
      behavior = new UserBehavior({ user: req.user._id });
    }

    // Track category click
    if (category) {
      behavior.lastCategory = category;
    }

    // Track search
    if (search) {
      behavior.searches.push(search);
    }

    await behavior.save();
  }

  // ⭐ Pagination setup
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;

  const totalListings = await Listing.countDocuments(filter);

  // ⭐ Fetch listings with reviews
  const allListings = await Listing.find(filter)
    .populate("reviews")
    .skip(skip)
    .limit(limit);

  // ⭐ Popularity ranking algorithm
  allListings.forEach(listing => {

    const reviews = listing.reviews ? listing.reviews.length : 0;

    listing._doc.score =
      reviews * 0.4 +
      listing.rating * 0.3 +
      listing.views * 0.2 +
      listing.bookingCount * 0.1;

  });

  // ⭐ Sort listings by score
  allListings.sort((a, b) => b._doc.score - a._doc.score);

  const totalPages = Math.ceil(totalListings / limit);

  // ⭐ Recommendation Engine
  let recommendedListings = [];

  if (req.user) {

    const behavior = await UserBehavior.findOne({ user: req.user._id });

    if (behavior && behavior.lastCategory) {

      recommendedListings = await Listing.find({
        category: behavior.lastCategory
      }).limit(3);

    }
  }

  // ⭐ TRENDING LISTINGS
const trendingListings = await Listing.find({})
.sort({ views: -1, bookingCount: -1 })
.limit(4);

  // ⭐ Render page
  res.render("listings/index", {
  allListings,
  recommendedListings,
  trendingListings,
  currentPage: page,
  totalPages,
  selectedCategory: category || null,
  searchQuery: search || ""
});

};

// NEW FORM
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};


// SHOW
module.exports.showListing = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    )
    .populate({
        path: "reviews",
        populate: {
            path: "author"
        }
    })
    .populate("owner");

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    const bookings = await Booking.find({ listing: id });

    // ⭐ Track viewed listings
    if (req.user) {

        let behavior = await UserBehavior.findOne({ user: req.user._id });

        if (!behavior) {
            behavior = new UserBehavior({ user: req.user._id });
        }

        if (!behavior.viewedListings.includes(listing._id)) {
            behavior.viewedListings.push(listing._id);
        }

        await behavior.save();
    }

    res.render("listings/show", {
        listing,
        bookings
    });

};

// CREATE

module.exports.createListing = async (req, res) => {
    try {
        const newListing = new Listing(req.body.listing);

        // ⭐ Upload image
        if (req.file) {
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        // ⭐ Geocoding BEFORE saving - with error handling
        if (!req.body.listing.location || req.body.listing.location.trim() === "") {
            req.flash("error", "Please provide a valid location!");
            return res.redirect("/listings/new");
        }

        try {
            const geoRes = await axios.get(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(req.body.listing.location)}&key=${process.env.GEOCODING_API_KEY}`
            );

            // Check if results exist
            if (!geoRes.data.results || geoRes.data.results.length === 0) {
                req.flash("error", "Location not found! Please enter a valid location.");
                return res.redirect("/listings/new");
            }

            const { lat, lng } = geoRes.data.results[0].geometry;

            newListing.geometry = {
                type: "Point",
                coordinates: [lng, lat]
            };
        } catch (geoErr) {
            console.error("Geocoding error:", geoErr.message);
            if (geoErr.response?.status === 403) {
                req.flash("error", "Geocoding service quota exceeded. Please try again later.");
            } else {
                req.flash("error", "Could not find location. Please try another location name.");
            }
            return res.redirect("/listings/new");
        }

        newListing.owner = req.user._id;

        await newListing.save();

        req.flash("success", "Listing created successfully!");
        res.redirect("/listings");
    } catch (err) {
        console.error("Create listing error:", err);
        req.flash("error", "Error creating listing. Please try again.");
        res.redirect("/listings/new");
    }
};


// EDIT FORM
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", { listing });
};


// UPDATE
 module.exports.updateListing = async (req, res) => {

    let { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    // ⭐ Delete old cloudinary image
    if (req.file && listing.image && listing.image.filename) {
        await cloudinary.uploader.destroy(listing.image.filename);
    }

    // ⭐ Update fields
    Object.assign(listing, req.body.listing);

    // ⭐ Save new image
    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    // ⭐ Geocoding BEFORE save - with error handling
    if (!req.body.listing.location || req.body.listing.location.trim() === "") {
        req.flash("error", "Please provide a valid location!");
        return res.redirect(`/listings/${id}/edit`);
    }

    try {
        const geoRes = await axios.get(
            `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(req.body.listing.location)}&key=${process.env.GEOCODING_API_KEY}`
        );

        // Check if results exist
        if (!geoRes.data.results || geoRes.data.results.length === 0) {
            req.flash("error", "Location not found! Please enter a valid location.");
            return res.redirect(`/listings/${id}/edit`);
        }

        const { lat, lng } = geoRes.data.results[0].geometry;

        listing.geometry = {
            type: "Point",
            coordinates: [lng, lat]
        };
    } catch (geoErr) {
        console.error("Geocoding error:", geoErr.message);
        if (geoErr.response?.status === 403) {
            req.flash("error", "Geocoding service quota exceeded. Please try again later.");
        } else {
            req.flash("error", "Could not find location. Please try another location name.");
        }
        return res.redirect(`/listings/${id}/edit`);
    }

    await listing.save();

    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
};


// DELETE
module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    // ⭐ Delete image from Cloudinary
    if (listing.image && listing.image.filename) {
        await cloudinary.uploader.destroy(listing.image.filename);
    }

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
};