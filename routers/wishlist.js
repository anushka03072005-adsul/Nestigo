const express = require("express");
const router = express.Router();

const wishlistController = require("../controllers/wishlist");
const { isLoggedIn } = require("../middleware");

router.post("/:id", isLoggedIn, wishlistController.toggleWishlist);

module.exports = router;