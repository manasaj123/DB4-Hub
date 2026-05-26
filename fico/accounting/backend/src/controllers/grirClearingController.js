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
      narration, // Added narration field
    } = req.body;

    const { GRIRClearing, Ledger, Invoice } = db;

    // 1. If invoiceId provided, fetch invoice and check outstanding
    if (invoiceId) {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        return res.status(400).json({ message: "Invoice not found" });
      }
      const maxClearable =
        Number(invoice.totalAmount) - Number(invoice.clearedAmount);
      if (Number(clearedAmount) > maxClearable) {
        return res.status(400).json({
          message: `Clearing amount exceeds invoice outstanding balance. Available: ₹${maxClearable.toFixed(2)}`,
        });
      }
    }

    // Check if same PO and Invoice combination already exists
    let existingEntry;
    if (invoiceId) {
      existingEntry = await GRIRClearing.findOne({ where: { invoiceId } });
    } else {
      existingEntry = await GRIRClearing.findOne({
        where: {
          poNumber: poNumber,
          invoiceNumber: invoiceNumber || vendorName || "N/A",
          vendorName: vendorName || invoiceNumber || "N/A",
        },
      });
    }

    if (existingEntry) {
      // Calculate remaining balance
      const totalCleared =
        Number(existingEntry.clearedAmount) + Number(clearedAmount);
      const pendingAmount = Number(existingEntry.amount) - totalCleared;

      // Determine new status
      let newStatus = "PARTIAL";
      if (pendingAmount === 0) {
        newStatus = "CLEARED";
      } else if (totalCleared === 0) {
        newStatus = "PENDING";
      }

      // Update existing entry
      await existingEntry.update({
        clearedAmount: totalCleared,
        status: newStatus,
        invoiceDate: invoiceDate || existingEntry.invoiceDate,
        narration: narration || existingEntry.narration,
      });

      const GRIR_ACCOUNT = "210004";
      const AP_ACCOUNT = "200001";
      const displayName = vendorName || invoiceNumber || "N/A";

      // Add clearing entries for the new amount only
      if (clearedAmount > 0) {
        await Ledger.bulkCreate([
          {
            date: invoiceDate || existingEntry.invoiceDate,
            accountCode: GRIR_ACCOUNT,
            description: `Additional IR clearing for PO ${poNumber} - ${displayName}`,
            debit: clearedAmount,
            credit: 0,
            referenceType: "GRIR",
            referenceNumber: existingEntry.id,
            grirId: existingEntry.id,
          },
          {
            date: invoiceDate || existingEntry.invoiceDate,
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
        message: "Additional amount cleared against existing entry",
        entry: existingEntry,
        remainingBalance: pendingAmount,
      });
    }

    // If no existing entry, create new one
    const entry = await GRIRClearing.create({
      poNumber,
      invoiceNumber: invoiceNumber || vendorName || "N/A",
      invoiceId: invoiceId || null,
      vendorName: vendorName || invoiceNumber || "N/A",
      amount,
      clearedAmount,
      status,
      grDate,
      invoiceDate,
      narration, // Added narration field
      createdBy: req.user.id,
    });

    const GRIR_ACCOUNT = "210004";
    const INVENTORY_ACCOUNT = "120001";
    const AP_ACCOUNT = "200001";

    const displayName = vendorName || invoiceNumber || "N/A";

    await db.Ledger.bulkCreate([
      {
        date: grDate,
        accountCode: INVENTORY_ACCOUNT,
        description: `GR for PO ${poNumber} - ${displayName}`,
        debit: amount,
        credit: 0,
        referenceType: "GRIR",
        referenceNumber: entry.id,
        grirId: entry.id,
      },
      {
        date: grDate,
        accountCode: GRIR_ACCOUNT,
        description: `GR/IR for PO ${poNumber} - ${displayName}`,
        debit: 0,
        credit: amount,
        referenceType: "GRIR",
        referenceNumber: entry.id,
        grirId: entry.id,
      },
    ]);

    if (invoiceId) {
      const invoice = await Invoice.findByPk(invoiceId);
      if (invoice) {
        const newCleared =
          Number(invoice.clearedAmount) + Number(clearedAmount);
        await invoice.update({ clearedAmount: newCleared });
      }
    }

    if (clearedAmount > 0) {
      await db.Ledger.bulkCreate([
        {
          date: invoiceDate,
          accountCode: GRIR_ACCOUNT,
          description: `IR clearing for PO ${poNumber} - ${displayName}`,
          debit: clearedAmount,
          credit: 0,
          referenceType: "GRIR",
          referenceNumber: entry.id,
          grirId: entry.id,
        },
        {
          date: invoiceDate,
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
    res.status(500).json({ message: err.message });
  }
};
