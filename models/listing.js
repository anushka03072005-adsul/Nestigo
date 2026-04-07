const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: String,

    image: {
        url: String,
        filename: String,
    },

    price: Number,

    location: String,

    country: String,
    views:{
type:Number,
default:0
},

rating:{
type:Number,
default:0
},

bookingCount:{
type:Number,
default:0
},

    category: {
        type: String,
        enum: [
            "trending",
            "iconic-cities",
            "mountains",
            "castles",
            "amazing-pools",
            "camping",
            "farms",
            "arctic"
        ]
    },

    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: false
        },
        coordinates: {
            type: [Number],
            required: false
        }
    },

    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

});


/* Delete reviews when listing is deleted */
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});


/* ⭐ Database Index for Search Optimization */
listingSchema.index({
    title: "text",
    location: "text",
    country: "text"
});


const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;