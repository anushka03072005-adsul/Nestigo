const User = require("../models/user");

module.exports.toggleWishlist = async (req, res) => {

  const listingId = req.params.id;

  const user = await User.findById(req.user._id);

  const exists = user.wishlist.includes(listingId);

  if (exists) {
    user.wishlist.pull(listingId);
  } else {
    user.wishlist.push(listingId);
  }

  await user.save();

  res.redirect(`/listings/${listingId}`);
};