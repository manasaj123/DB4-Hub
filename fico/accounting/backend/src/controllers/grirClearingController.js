// controllers/grirClearingController.js

const db = require("../config/db");
const { GRIRClearing, Ledger, Invoice } = db;

exports.createGrirEntry = async (req, res, next) => {
  try {
    const {
      poNumber,
      invoiceNumber,
      invoiceId,
      vendorName,
      amount,
      clearedAmount,
      status,
      grDate,
      invoiceDate,
      narration,
    } = req.body;

    // Safe date fallbacks
    const safeGrDate = grDate || new Date();
    const safeInvoiceDate = invoiceDate || new Date();

    // 1. If invoiceId provided, fetch invoice and check outstanding
    if (invoiceId) {
      const invoice = await Invoice.findByPk(invoiceId);

      if (!invoice) {
        return res.status(400).json({
          message: "Invoice not found",
        });
      }

      const maxClearable =
        Number(invoice.totalAmount) - Number(invoice.clearedAmount);

      if (Number(clearedAmount) > maxClearable) {
        return res.status(400).json({
          message: `Clearing amount exceeds invoice outstanding balance. Available: ₹${maxClearable.toFixed(
            2,
          )}`,
        });
      }
    }

    // Check existing GRIR entry
    let existingEntry;

    if (invoiceId) {
      existingEntry = await GRIRClearing.findOne({
        where: { invoiceId },
      });
    } else {
      existingEntry = await GRIRClearing.findOne({
        where: {
          poNumber: poNumber,
          invoiceNumber: invoiceNumber || vendorName || "N/A",
          vendorName: vendorName || invoiceNumber || "N/A",
        },
      });
    }

    // =========================
    // UPDATE EXISTING ENTRY
    // =========================
    if (existingEntry) {
      const totalCleared =
        Number(existingEntry.clearedAmount) + Number(clearedAmount);

      const pendingAmount =
        Number(existingEntry.amount) - totalCleared;

      let newStatus = "PARTIAL";

      if (pendingAmount === 0) {
        newStatus = "CLEARED";
      } else if (totalCleared === 0) {
        newStatus = "PENDING";
      }

      await existingEntry.update({
        clearedAmount: totalCleared,
        status: newStatus,
        invoiceDate:
          invoiceDate || existingEntry.invoiceDate || new Date(),
        narration: narration || existingEntry.narration,
      });

      const GRIR_ACCOUNT = "210004";
      const AP_ACCOUNT = "200001";

      const displayName =
        vendorName || invoiceNumber || "N/A";

      // Additional clearing entries
      if (clearedAmount > 0) {
        await Ledger.bulkCreate([
          {
            date:
              invoiceDate ||
              existingEntry.invoiceDate ||
              new Date(),

            accountCode: GRIR_ACCOUNT,

            description: `Additional IR clearing for PO ${poNumber} - ${displayName}`,

            debit: clearedAmount,
            credit: 0,

            referenceType: "GRIR",
            referenceNumber: existingEntry.id,
            grirId: existingEntry.id,
          },

          {
            date:
              invoiceDate ||
              existingEntry.invoiceDate ||
              new Date(),

            accountCode: AP_ACCOUNT,

            description: `Additional AP Booking - ${displayName} vs PO ${poNumber}`,

            debit: 0,
            credit: clearedAmount,

            referenceType: "GRIR",
            referenceNumber: existingEntry.id,
            grirId: existingEntry.id,
          },
        ]);
      }

      return res.json({
        message:
          "Additional amount cleared against existing entry",
        entry: existingEntry,
        remainingBalance: pendingAmount,
      });
    }

    // =========================
    // CREATE NEW ENTRY
    // =========================

    const entry = await GRIRClearing.create({
      poNumber,

      invoiceNumber:
        invoiceNumber || vendorName || "N/A",

      invoiceId: invoiceId || null,

      vendorName:
        vendorName || invoiceNumber || "N/A",

      amount,
      clearedAmount,
      status,

      grDate: safeGrDate,
      invoiceDate: safeInvoiceDate,

      narration,

      createdBy: req.user.id,
    });

    const GRIR_ACCOUNT = "210004";
    const INVENTORY_ACCOUNT = "120001";
    const AP_ACCOUNT = "200001";

    const displayName =
      vendorName || invoiceNumber || "N/A";

    // =========================
    // GOODS RECEIPT ENTRIES
    // =========================

    await Ledger.bulkCreate([
      {
        date: safeGrDate,

        accountCode: INVENTORY_ACCOUNT,

        description: `GR for PO ${poNumber} - ${displayName}`,

        debit: amount,
        credit: 0,

        referenceType: "GRIR",
        referenceNumber: entry.id,
        grirId: entry.id,
      },

      {
        date: safeGrDate,

        accountCode: GRIR_ACCOUNT,

        description: `GR/IR for PO ${poNumber} - ${displayName}`,

        debit: 0,
        credit: amount,

        referenceType: "GRIR",
        referenceNumber: entry.id,
        grirId: entry.id,
      },
    ]);

    // =========================
    // UPDATE INVOICE CLEARED AMOUNT
    // =========================

    if (invoiceId) {
      const invoice = await Invoice.findByPk(invoiceId);

      if (invoice) {
        const newCleared =
          Number(invoice.clearedAmount) +
          Number(clearedAmount);

        await invoice.update({
          clearedAmount: newCleared,
        });
      }
    }

    // =========================
    // INVOICE RECEIPT ENTRIES
    // =========================

    if (clearedAmount > 0) {
      await Ledger.bulkCreate([
        {
          date: safeInvoiceDate,

          accountCode: GRIR_ACCOUNT,

          description: `IR clearing for PO ${poNumber} - ${displayName}`,

          debit: clearedAmount,
          credit: 0,

          referenceType: "GRIR",
          referenceNumber: entry.id,
          grirId: entry.id,
        },

        {
          date: safeInvoiceDate,

          accountCode: AP_ACCOUNT,

          description: `Vendor ${displayName} vs PO ${poNumber}`,

          debit: 0,
          credit: clearedAmount,

          referenceType: "GRIR",
          referenceNumber: entry.id,
          grirId: entry.id,
        },
      ]);
    }

    res.status(201).json(entry);
  } catch (err) {
    console.error("GRIR CREATE ERROR:", err);

    next(err);
  }
};

exports.listGrirEntries = async (req, res) => {
  try {
    const entries = await GRIRClearing.findAll({
      order: [["grDate", "DESC"]],
    });

    res.json(entries);
  } catch (err) {
    console.error("GRIR list error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};