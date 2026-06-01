// const express = require('express');
// const router = express.Router();
// const billingController = require('../controllers/billingController');

// router.get('/', billingController.getBillings);
// router.get('/deleted', billingController.getDeletedBillings);
// router.get('/:id', billingController.getBillingById);
// router.post('/', billingController.createBilling);
// router.put('/:id', billingController.updateBilling);
// router.delete('/:id', billingController.softDeleteBilling);
// router.put('/:id/restore', billingController.restoreBilling);

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getBillings,
  getDeletedBillings,
  getBillingById,
  createBilling,
  updateBilling,
  softDeleteBilling,
  restoreBilling,
  getUnbilledDeliveries, // new
} = require("../controllers/billingController");

router.get("/", getBillings);
router.get("/deleted", getDeletedBillings);
router.get("/unbilled-deliveries", getUnbilledDeliveries); // new route
router.get("/:id", getBillingById);
router.post("/", createBilling);
router.put("/:id", updateBilling);
router.delete("/:id", softDeleteBilling);
router.put("/:id/restore", restoreBilling);

module.exports = router;
