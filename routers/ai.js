const express = require("express");
const router = express.Router();

const aiController = require("../controllers/ai");

router.get("/assistant", aiController.travelAssistant);

module.exports = router;