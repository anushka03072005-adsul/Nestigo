const Listing = require("../models/listing");

module.exports.travelAssistant = async (req, res) => {
    try {
        let { query } = req.query;
        let recommendations = [];

        if (query) {
            query = query.toLowerCase().trim();

            // Category mappings for better query matching
            if (query.includes("mountain") || query.includes("peak") || query.includes("hill") || query.includes("snow")) {
                recommendations = await Listing.find({ category: "mountains" }).limit(5);
            }
            else if (query.includes("beach") || query.includes("sand") || query.includes("ocean") || query.includes("sea") || query.includes("water") || query.includes("pool")) {
                recommendations = await Listing.find({ category: "amazing-pools" }).limit(5);
            }
            else if (query.includes("castle") || query.includes("historic") || query.includes("palace") || query.includes("fort")) {
                recommendations = await Listing.find({ category: "castles" }).limit(5);
            }
            else if (query.includes("camp") || query.includes("tent") || query.includes("nature")) {
                recommendations = await Listing.find({ category: "camping" }).limit(5);
            }
            else if (query.includes("farm") || query.includes("rural") || query.includes("village")) {
                recommendations = await Listing.find({ category: "farms" }).limit(5);
            }
            else if (query.includes("arctic") || query.includes("snow") || query.includes("cold") || query.includes("ice") || query.includes("polar")) {
                recommendations = await Listing.find({ category: "arctic" }).limit(5);
            }
            else if (query.includes("city") || query.includes("urban") || query.includes("metro") || query.includes("downtown")) {
                recommendations = await Listing.find({ category: "iconic-cities" }).limit(5);
            }
            else if (query.includes("trend") || query.includes("popular") || query.includes("best") || query.includes("top")) {
                recommendations = await Listing.find({ category: "trending" }).limit(5);
            }
            else {
                // Default: get trending listings if no match
                recommendations = await Listing.find({}).limit(5);
            }
        } else {
            // No query: return trending listings
            recommendations = await Listing.find({ category: "trending" }).limit(5);
        }

        res.json(recommendations);

    } catch (error) {
        console.error("AI Assistant Error:", error);
        res.status(500).json({ error: "Error processing request" });
    }
};