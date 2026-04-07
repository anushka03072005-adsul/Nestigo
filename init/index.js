const mongoose = require('mongoose');
const initilizedata = require('./data.js');
const Listing = require('../models/listing.js');

// Use Atlas URL if available, otherwise local
const MONGO_URL = process.env.ATLAS_URL || process.env.MONGO_URL || "mongodb://localhost:27017/Nestigo";

console.log(`📊 Seeding to: ${MONGO_URL.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);

main()
    .then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.error("Error connecting to MongoDB", err);
    });

async function main() {
    await mongoose.connect(MONGO_URL, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4
    });
}

const initDB = async () => {
    try {
        await Listing.deleteMany({});
        await Listing.insertMany(initilizedata.data);
        console.log("✅ Data was initialized on MongoDB Atlas");
    } catch (err) {
        console.error("Error initializing data:", err.message);
    }
}

initDB().then(() => {
    mongoose.connection.close();
    process.exit(0);
});