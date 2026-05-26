const express = require("express");
const router = express.Router();
const { addStock, getStock } = require("../controllers/stockController");

router.post("/", addStock);
router.get("/", getStock);

module.exports = router;
