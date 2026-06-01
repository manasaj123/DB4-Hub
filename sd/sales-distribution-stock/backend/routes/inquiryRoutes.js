const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");

router.get("/", inquiryController.getInquiries);
router.get("/deleted", inquiryController.getDeletedInquiries);
router.get("/:id", inquiryController.getInquiryById);
router.post("/", inquiryController.createInquiry);
router.put("/:id", inquiryController.updateInquiry);
router.delete("/:id", inquiryController.softDeleteInquiry);
router.put("/:id/restore", inquiryController.restoreInquiry);
router.post("/:id/convert-to-order", inquiryController.convertToOrder);

module.exports = router;
