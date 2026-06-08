import express from "express";
import {
  getInvoices,
  createInvoice,
  verifyInvoice,
  togglePaymentBlock,
  getInvoiceItems,
} from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/", getInvoices);
router.post("/", createInvoice);
router.patch("/:id/verify", verifyInvoice);
router.patch("/:id/toggle-block", togglePaymentBlock);
router.get("/:id/items", getInvoiceItems);
// later: router.patch("/:id/release-block", releaseBlock);

export default router;
