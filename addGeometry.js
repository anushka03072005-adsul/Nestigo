require("dotenv").config();

const mongoose = require("mongoose");
const Listing = require("./models/listing");
const axios = require("axios");

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const updateGeometry = async () => {

    const listings = await Listing.find({});

    for (let listing of listings) {

        try {

            const geoRes = await axios.get(
                `https://api.opencagedata.com/geocode/v1/json?q=${listing.location}&key=${process.env.GEOCODING_API_KEY}`
            );

            const { lat, lng } = geoRes.data.results[0].geometry;

            listing.geometry = {
                type: "Point",
                coordinates: [lng, lat]
            };

            await listing.save();

            console.log("Updated:", listing.title);

        } catch (err) {
            console.log("Failed:", listing.title);
        }
    }

    console.log("All listings updated 🎉");
    mongoose.connection.close();
};

updateGeometry();