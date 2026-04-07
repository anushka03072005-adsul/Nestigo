const express = require("express");
const router = express.Router();

const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const { listingSchema } = require("../schema.js");
const { isLoggedIn, isOwner } = require("../middleware");
const listingController = require("../controllers/listing");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

// validation
const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map(el => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};



// ================= INDEX =================
router.get("/", wrapAsync(async (req, res) => {

  const { category, page = 1 } = req.query;

  const limit = 9;
  const skip = (page - 1) * limit;

  let filter = {};

  if (category) {
    filter.category = category;
  }

  const allListings = await Listing.find(filter)
    .skip(skip)
    .limit(limit);

  const totalListings = await Listing.countDocuments(filter);

  const totalPages = Math.ceil(totalListings / limit);

  const trendingListings = await Listing.find()
    .sort({ views: -1 })
    .limit(4);

  const recommendedListings = await Listing.find()
    .sort({ rating: -1 })
    .limit(3);

  res.render("listings/index", {
    allListings,
    trendingListings,
    recommendedListings,
    selectedCategory: category,
    currentPage: parseInt(page),
    totalPages
  });

}));



// ================= NEW =================
router.get("/new", isLoggedIn, listingController.renderNewForm);



// ================= SHOW =================
router.get("/:id", wrapAsync(listingController.showListing));



// ================= CREATE =================
router.post(
  "/",
  isLoggedIn,
  upload.single("listingImage"),
  validateListing,
  wrapAsync(listingController.createListing)
);



// ================= EDIT =================
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);



// ================= UPDATE =================
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.single("listingImage"),
  validateListing,
  wrapAsync(listingController.updateListing)
);



// ================= DELETE =================
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.deleteListing)
);

module.exports = router;