require("dotenv").config();

const mongoose = require("mongoose");
const Listing = require("./models/listing");
const { cloudinary } = require("./cloudConfig");

// ⭐ Connect DB
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ⭐ Hotel Images Pool
const sampleImages = [
"https://images.unsplash.com/photo-1566073771259-6a8506099945",
"https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
"https://images.unsplash.com/photo-1571896349842-33c89424de2d",
"https://images.unsplash.com/photo-1559599101-f09722fb4948",
"https://images.unsplash.com/photo-1564501049412-61c2a3083791",
"https://images.unsplash.com/photo-1590490360182-c33d57733427",
"https://images.unsplash.com/photo-1596394516093-501ba68a0ba6",
"https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
"https://images.unsplash.com/photo-1501117716987-c8e2a91f5c4e",
"https://images.unsplash.com/photo-1549298916-b41d501d3772",
"https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
"https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd",
"https://images.unsplash.com/photo-1521783593447-5702b9bfd267",
"https://images.unsplash.com/photo-1535827841776-24afc1e255ac",
"https://images.unsplash.com/photo-1598928506311-c55ded91a20c",
"https://images.unsplash.com/photo-1554995207-c18c203602cb",
"https://images.unsplash.com/photo-1505691723518-36a5ac3b2d07"
];

// ⭐ Update Listings
const updateImages = async () => {

    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings`);

    for (let i = 0; i < listings.length; i++) {

        try {

            let imgUrl = sampleImages[i % sampleImages.length];

            console.log("Uploading for:", listings[i].title);

            const uploaded = await cloudinary.uploader.upload(imgUrl, {
                folder: "Nestigo"
                
            });

            listings[i].image = {
                url: uploaded.secure_url,
                filename: uploaded.public_id
            };

            await listings[i].save();

            console.log("Updated:", listings[i].title);

        } catch (err) {
            console.log("Failed:", listings[i].title, err.message);
        }
    }

    console.log("All listings updated 🎉");
    mongoose.connection.close();
};

updateImages();