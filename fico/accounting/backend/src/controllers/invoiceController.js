// backend/src/controllers/invoiceController.js
const db = require('../config/db');
const { Invoice, Ledger } = db;
const { fn, col } = db.sequelize;


// helper: calculate GST/TDS and totals
const computeInvoiceAmounts = ({ baseAmount, gstRate, tdsRate }) => {
  const base = Number(baseAmount) || 0;
  const gstR = Number(gstRate) || 0;
  const tdsR = Number(tdsRate) || 0;

  const gstAmount = (base * gstR) / 100;
  const tdsAmount = (base * tdsR) / 100;

  const totalAmount = base + gstAmount - tdsAmount;
  return { gstAmount, tdsAmount, totalAmount };
};


// helper: generate invoice number DB4-INV-001, DB4-INV-002, ...
const generateInvoiceNumber = async () => {
  const last = await Invoice.findOne({
    order: [['id', 'DESC']],
  });

  let nextSeq = 1;
  if (last && last.invoiceNumber) {
    const parts = String(last.invoiceNumber).split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const seqStr = String(nextSeq).padStart(3, '0'); // 001, 002, 003
  return `DB4-INV-${seqStr}`;
};


const postInvoiceLedger = async (invoice, transaction) => {
  const {
    id,
    type,
    invoiceNumber,
    date,
    baseAmount,
    gstAmount,
    tdsAmount,
    totalAmount,
    costCenterId,
    profitCenterId,
  } = invoice;

  const base = Number(baseAmount);
  const gst = Number(gstAmount);
  const tds = Number(tdsAmount);
  const total = Number(totalAmount);

  // Assume GL codes for demo
  const AR_ACCOUNT = '300001'; // Accounts Receivable
  const AP_ACCOUNT = '200001'; // Accounts Payable
  const REVENUE_ACCOUNT = '400001';
  const EXPENSE_ACCOUNT = '500001';
  const GST_OUTPUT = '210001';
  const GST_INPUT = '110001';
  const TDS_RECEIVABLE = '310001';
  const TDS_PAYABLE = '210002';

  const common = {
    date,
    referenceType: 'INVOICE',
    referenceNumber: invoiceNumber,
    invoiceId: id,
    costCenterId,
    profitCenterId,
  };

  if (type === 'AR') {
    await Ledger.bulkCreate(
      [
        {
          ...common,
          accountCode: AR_ACCOUNT,
          description: `Customer invoice ${invoiceNumber}`,
          debit: total,
          credit: 0,
        },
        {
          ...common,
          accountCode: REVENUE_ACCOUNT,
          description: `Revenue for invoice ${invoiceNumber}`,
          debit: 0,
          credit: base,
        },
        gst > 0
          ? {
              ...common,
              accountCode: GST_OUTPUT,
              description: `GST output for invoice ${invoiceNumber}`,
              debit: 0,
              credit: gst,
            }
          : null,
        tds > 0
          ? {
              ...common,
              accountCode: TDS_RECEIVABLE,
              description: `TDS receivable for invoice ${invoiceNumber}`,
              debit: tds,
              credit: 0,
            }
          : null,
      ].filter(Boolean),
      { transaction }
    );
  } else {
    await Ledger.bulkCreate(
      [
        {
          ...common,
          accountCode: EXPENSE_ACCOUNT,
          description: `Vendor expense for invoice ${invoiceNumber}`,
          debit: base,
          credit: 0,
        },
        gst > 0
          ? {
              ...common,
              accountCode: GST_INPUT,
              description: `GST input for invoice ${invoiceNumber}`,
              debit: gst,
              credit: 0,
            }
          : null,
        {
          ...common,
          accountCode: AP_ACCOUNT,
          description: `Vendor invoice ${invoiceNumber}`,
          debit: 0,
          credit: total,
        },
        tds > 0
          ? {
              ...common,
              accountCode: TDS_PAYABLE,
              description: `TDS payable for invoice ${invoiceNumber}`,
              debit: 0,
              credit: tds,
            }
          : null,
      ].filter(Boolean),
      { transaction }
    );
  }
};

///// ADD THIS ONE LINE ONLY /////
exports.postInvoiceLedger = postInvoiceLedger;
//////////////////////////////////


exports.list = async (req, res) => {
  try {
    const accounts = await GLAccount.findAll({
      order: [['glCode', 'ASC']],
    });
    res.json(accounts);
  } catch (err) {
    console.error('GLAccount list error', err);
    res.status(500).json({ message: 'Failed to load GL accounts' });
  }
};


exports.createInvoice = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      // invoiceNumber, // ignore from body – we generate it
      type,
      partyName,
      partyGSTIN,
      date,
      dueDate,
      baseAmount,
      gstRate,
      tdsRate,
      costCenterId,
      profitCenterId,
      narration,
    } = req.body;

    const { gstAmount, tdsAmount, totalAmount } = computeInvoiceAmounts({
      baseAmount,
      gstRate,
      tdsRate,
    });

    let invoice;
    let lastError;

    // Try up to 2 times to avoid rare duplicate invoiceNumber under concurrency
    for (let attempt = 0; attempt < 2; attempt++) {
      const invoiceNumber = await generateInvoiceNumber();
      try {
        invoice = await Invoice.create(
          {
            invoiceNumber,
            type,
            partyName,
            partyGSTIN,
            date,
            dueDate,
            baseAmount,
            gstRate,
            gstAmount,
            tdsRate,
            tdsAmount,
            totalAmount,
            balanceAmount: totalAmount,
            status: 'PARKED',
            createdBy: req.user.id,
            costCenterId,
            profitCenterId,
            narration,
          },
          { transaction: t }
        );
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        if (
          err.name === 'SequelizeUniqueConstraintError' &&
          err.fields &&
          err.fields.invoiceNumber &&
          attempt === 0
        ) {
          // retry once with next number
          continue;
        }
        throw err;
      }
    }

    if (!invoice && lastError) {
      throw lastError;
    }

    await postInvoiceLedger(invoice, t);

    await t.commit();
    res.status(201).json(invoice);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};


exports.listInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      order: [['date', 'DESC'], ['id', 'DESC']],
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};


exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};


// list all invoices for a given party name
exports.listInvoicesByParty = async (req, res, next) => {
  try {
    const { partyName } = req.params;

    const invoices = await Invoice.findAll({
      where: { partyName },
      order: [['date', 'DESC'], ['id', 'DESC']],
    });

    res.json(invoices);
  } catch (err) {
    next(err);
  }
};


// Summary: one row per party with summed totals
exports.listInvoiceSummaryByParty = async (req, res, next) => {
  try {
    const rows = await Invoice.findAll({
      attributes: [
        'partyName',
        [fn('SUM', col('totalAmount')), 'totalAmount'],
        [fn('SUM', col('balanceAmount')), 'balanceAmount'],
      ],
      group: ['partyName'],
      order: [['partyName', 'ASC']],
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


exports.listOpenInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      where: {
        balanceAmount: { [db.Sequelize.Op.gt]: 0 },
        status: { [db.Sequelize.Op.notIn]: ['CANCELLED'] },
      },
      order: [['dueDate', 'ASC']],
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};


exports.listPaymentsForInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice to know AR / AP
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    let where = { invoiceId };

    // For AR invoice: show RECEIPT; for AP invoice: show PAYMENT
    if (invoice.type === 'AR') {
      where.type = 'RECEIPT';
    } else if (invoice.type === 'AP') {
      where.type = 'PAYMENT';
    }

    const payments = await Payment.findAll({
      where,
      order: [['date', 'DESC'], ['id', 'DESC']],
    });

    res.json(payments);
  } catch (err) {
    next(err);
  }
};


exports.listInvoiceParties = async (req, res, next) => {
  try {
    const rows = await Invoice.findAll({
      attributes: [
        [db.sequelize.fn('DISTINCT', db.sequelize.col('partyName')), 'partyName'],
        'type'
      ],
      order: [['partyName', 'ASC']]
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// in invoiceController.js
exports.getNextInvoiceNumber = async (req, res, next) => {
  try {
    const last = await Invoice.findOne({
      where: { type: 'AR' },
      order: [['id', 'DESC']]
    });

    let nextNumber = 'DB4-INV-001';
    if (last) {
      const match = last.invoiceNumber.match(/DB4-INV-(\d+)/);
      if (match) {
        const next = String(parseInt(match[1], 10) + 1).padStart(3, '0');
        nextNumber = `DB4-INV-${next}`;
      }
    }

    res.json({ nextInvoiceNumber: nextNumber });
  } catch (err) {
    next(err);
  }
};

// backend/src/controllers/invoiceController.js

// Get invoices by status (for approval workflow)
exports.getInvoicesByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const invoices = await Invoice.findAll({
      where,
      order: [['date', 'DESC'], ['id', 'DESC']]
    });
    
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices by status:', err);
    res.status(500).json({ message: err.message });
  }
};

// backend/src/controllers/invoiceController.js

// Update invoice status (approve/reject)
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    
    if (!['APPROVED', 'REJECTED', 'PARKED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    await invoice.update({
      status,
      narration: remarks ? `${invoice.narration || ''} [${status}: ${remarks}]` : invoice.narration
    });
    
    res.json({ 
      message: `Invoice ${status.toLowerCase()} successfully`,
      invoice 
    });
  } catch (err) {
    console.error('Error updating invoice status:', err);
    res.status(500).json({ message: err.message });
  }
};

// backend/src/controllers/invoiceController.js

// Add this function if not already present
exports.getParkedInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: {
        status: 'PARKED'  // Only get PARKED invoices
      },
      order: [['date', 'DESC'], ['id', 'DESC']],
      include: [
        {
          model: db.User,
          attributes: ['name', 'username'],
          required: false
        }
      ]
    });

    // Format the response
    const result = invoices.map(invoice => {
      const invJson = invoice.toJSON();
      return {
        ...invJson,
        createdByName: invJson.User?.name || invJson.createdByName || 'Unknown'
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching parked invoices:', err);
    res.status(500).json({ message: err.message });
  }
};