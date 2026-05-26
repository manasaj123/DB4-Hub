const express = require("express");
const router = express.Router();
const { getReadyForPGI, performPGI } = require("../controllers/pgiController");

router.get("/ready", getReadyForPGI);
router.post("/:deliveryId", performPGI);

module.exports = router;
