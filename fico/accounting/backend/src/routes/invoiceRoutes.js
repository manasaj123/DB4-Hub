const express = require('express');
const router = express.Router();

const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware('ADMIN', 'ACCOUNTANT'),
  auditMiddleware('CREATE_INVOICE'),
  invoiceController.createInvoice
);

// Summary by party
router.get(
  '/summary/by-party',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'AUDITOR', 'VIEWER'),
  invoiceController.listInvoiceSummaryByParty
);

router.get(
  '/',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'AUDITOR', 'VIEWER'),
  invoiceController.listInvoices
);

router.get(
  '/party/:partyName',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'AUDITOR', 'VIEWER'),
  invoiceController.listInvoicesByParty
);

router.get(
  '/open',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'AUDITOR', 'VIEWER'),
  invoiceController.listOpenInvoices
);

// src/routes/invoiceRoutes.js
router.get(
  '/parties',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'AUDITOR', 'VIEWER'),
  invoiceController.listInvoiceParties
);

// backend/src/routes/invoice.js (or wherever your invoice routes are)

// Get invoices by status (for approval)
router.get(
  '/status/:status',
  authMiddleware,
  invoiceController.getInvoicesByStatus
);

// backend/src/routes/invoice.js

// Update invoice status
router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'APPROVER'),
  invoiceController.updateInvoiceStatus
);
// backend/src/routes/invoice.js

// Get parked invoices for approval
router.get(
  '/parked',
  authMiddleware,
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'APPROVER'),
  invoiceController.getParkedInvoices
);
// routes/invoiceRoutes.js
router.get('/next-number', authMiddleware, invoiceController.getNextInvoiceNumber);

router.get(
  '/:id',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'AUDITOR', 'VIEWER'),
  invoiceController.getInvoice
);


module.exports = router;
