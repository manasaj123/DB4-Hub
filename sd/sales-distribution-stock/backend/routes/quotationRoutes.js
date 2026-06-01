const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');

router.get('/', quotationController.getQuotations);
router.get('/deleted', quotationController.getDeletedQuotations);
router.get('/:id', quotationController.getQuotationById);
router.post('/', quotationController.createQuotation);
router.put('/:id', quotationController.updateQuotation);
router.delete('/:id', quotationController.softDeleteQuotation);
router.put('/:id/restore', quotationController.restoreQuotation);

router.post('/:id/convert-to-order', quotationController.convertToOrder);

module.exports = router;
