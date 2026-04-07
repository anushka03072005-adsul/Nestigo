const Booking = require("../models/booking");
const UserBehavior = require("../models/UserBehavior");
const Listing = require("../models/listing");

module.exports.createBooking = async (req,res)=>{
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.body;

    // Validate that booking dates are provided
    if (!checkIn || !checkOut) {
      req.flash("error", "Please provide both check-in and check-out dates!");
      return res.redirect(`/listings/${id}`);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of today

    // Validate that check-in is not in the past
    if (checkInDate < today) {
      req.flash("error", "Cannot book dates in the past!");
      return res.redirect(`/listings/${id}`);
    }

    // Validate that check-out is after check-in
    if (checkOutDate <= checkInDate) {
      req.flash("error", "Check-out date must be after check-in date!");
      return res.redirect(`/listings/${id}`);
    }

    // Minimum stay requirement (1 day)
    const daysDifference = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
    if (daysDifference < 1) {
      req.flash("error", "Minimum stay is 1 night!");
      return res.redirect(`/listings/${id}`);
    }

    // Check for overlapping bookings
    const conflictingBooking = await Booking.findOne({
      listing: id,
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
      ]
    });

    if (conflictingBooking) {
      req.flash("error", "These dates are already booked! Please select different dates.");
      return res.redirect(`/listings/${id}`);
    }

    // Create the booking
    const newBooking = new Booking({
      listing: id,
      user: req.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate
    });

    await newBooking.save();

    // Update listing booking count
    await Listing.findByIdAndUpdate(id, {
      $inc: { bookingCount: 1 }
    });

    // TRACK USER BOOKING BEHAVIOR
    if (req.user) {
      let behavior = await UserBehavior.findOne({ user: req.user._id });

      if (!behavior) {
        behavior = new UserBehavior({ user: req.user._id });
      }

      behavior.bookings.push(newBooking._id);
      await behavior.save();
    }

    req.flash("success", "Booking successful!");
    res.redirect(`/listings/${id}`);

  } catch (err) {
    console.error("Booking error:", err);
    req.flash("error", "Failed to create booking. Please try again.");
    res.redirect(`/listings/${req.params.id}`);
  }
};