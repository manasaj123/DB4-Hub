// backend/src/controllers/journalController.js
const db = require("../config/db");
const { sequelize } = db;

// models
const JournalHeader = db.JournalHeader;
const JournalLine = db.JournalLine;

console.log("JournalLine attributes:", Object.keys(JournalLine.rawAttributes));

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

// Generate simple running document number: JR000001, JR000002, ...
// Must be called inside a transaction to prevent duplicates.
const generateDocNumber = async (transaction) => {
  const last = await JournalHeader.findOne({
    order: [["id", "DESC"]],
    attributes: ["id"],
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  const next = (last ? last.id + 1 : 1).toString().padStart(6, "0");
  return `JR${next}`;
};

// Valid characters for codes (alphanumeric, hyphen, underscore, period)
const CODE_REGEX = /^[A-Za-z0-9\-_.]+$/;

// Allowed document types (adjust as needed)
const ALLOWED_DOC_TYPES = ["SA", "AB", "KG", "RV", "WA", "WI"];

// Allowed statuses
const ALLOWED_STATUSES = ["POSTED", "HELD"];

// ------------------------------------------------------------------
// GET /api/journal  -> summary list
// ------------------------------------------------------------------
exports.list = async (req, res) => {
  try {
    const rows = await JournalHeader.findAll({
      order: [["id", "DESC"]],
    });
    res.json(rows);
  } catch (err) {
    console.error("Journal list error", err);
    res.status(500).json({ message: "Failed to load journals" });
  }
};

// ------------------------------------------------------------------
// POST /api/journal  -> create header + lines
// ------------------------------------------------------------------
exports.create = async (req, res) => {
  let t; // declared here so catch block can access it
  try {
    const { header, lines } = req.body;

    t = await sequelize.transaction();

    console.log("Incoming header:", header);
    console.log("Incoming lines:", lines);

    // ---------- basic existence checks ----------
    if (!header || !lines) {
      await t.rollback();
      return res.status(400).json({ message: "Header and lines are required" });
    }
    if (!Array.isArray(lines) || !lines.length) {
      await t.rollback();
      return res.status(400).json({ message: "At least one line required" });
    }

    // ---------- header field validations ----------
    const {
      documentDate,
      postingDate,
      documentType = "SA",
      reference = "",
      headerText = "",
      companyCode,
      status = "POSTED",
    } = header;

    // Required fields
    if (!documentDate) {
      await t.rollback();
      return res.status(400).json({ message: "Document date is required" });
    }
    if (!postingDate) {
      await t.rollback();
      return res.status(400).json({ message: "Posting date is required" });
    }
    if (!companyCode || !String(companyCode).trim()) {
      await t.rollback();
      return res.status(400).json({ message: "Company code is required" });
    }

    // Check date format validity (simple check, Sequelize/DATEONLY will also validate)
    const docDate = new Date(documentDate);
    const postDate = new Date(postingDate);
    if (isNaN(docDate) || isNaN(postDate)) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (postDate < docDate) {
      await t.rollback();
      return res.status(400).json({
        message: "Posting date cannot be before document date",
      });
    }

    // Company code: length + characters
    const cc = String(companyCode).trim();
    if (cc.length > 4) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Company code must be ≤ 4 characters" });
    }
    if (!CODE_REGEX.test(cc)) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Company code can only contain letters, numbers, hyphen, underscore, period",
      });
    }

    // Document type
    const dt = String(documentType).trim().toUpperCase();
    if (dt.length > 2) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Document type must be 2 characters max" });
    }
    if (!ALLOWED_DOC_TYPES.includes(dt)) {
      await t.rollback();
      return res
        .status(400)
        .json({
          message: `Invalid document type. Allowed: ${ALLOWED_DOC_TYPES.join(", ")}`,
        });
    }

    // Status
    const st = String(status).trim().toUpperCase();
    if (!ALLOWED_STATUSES.includes(st)) {
      await t.rollback();
      return res
        .status(400)
        .json({
          message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`,
        });
    }

    // Reference (optional, max 16 chars, code characters)
    const ref = String(reference).trim();
    if (ref.length > 16) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Reference must be ≤ 16 characters" });
    }
    if (ref.length > 0 && !CODE_REGEX.test(ref)) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Reference can only contain letters, numbers, hyphen, underscore, period",
      });
    }

    // Header text (optional, max 50 chars, broader text but no control chars)
    const ht = String(headerText).trim();
    if (ht.length > 50) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Header text must be ≤ 50 characters" });
    }
    if (/[\x00-\x1F\x7F]/.test(ht)) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Header text contains invalid control characters" });
    }

    // ---------- line validations ----------
    let totalDebit = 0;
    let totalCredit = 0;

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const lineNum = i + 1;

      // glAccount required and valid
      if (!l.glAccount || !String(l.glAccount).trim()) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: `Line ${lineNum}: G/L account is required` });
      }
      const gl = String(l.glAccount).trim();
      if (gl.length > 20) {
        await t.rollback();
        return res
          .status(400)
          .json({
            message: `Line ${lineNum}: G/L account must be ≤ 20 characters`,
          });
      }
      if (!CODE_REGEX.test(gl)) {
        await t.rollback();
        return res.status(400).json({
          message: `Line ${lineNum}: G/L account can only contain letters, numbers, hyphen, underscore, period`,
        });
      }

      // Debit and credit amounts
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;

      if (isNaN(debit) || isNaN(credit)) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: `Line ${lineNum}: Invalid amount` });
      }
      if (debit < 0 || credit < 0) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: `Line ${lineNum}: Negative amounts not allowed` });
      }
      if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        await t.rollback();
        return res
          .status(400)
          .json({
            message: `Line ${lineNum}: Must have either debit or credit`,
          });
      }

      totalDebit += debit;
      totalCredit += credit;

      // Optional fields: costCenterId, profitCenterId (max 20 chars, code pattern)
      if (
        l.costCenterId !== undefined &&
        l.costCenterId !== null &&
        l.costCenterId !== ""
      ) {
        const ccId = String(l.costCenterId).trim();
        if (ccId.length > 20) {
          await t.rollback();
          return res
            .status(400)
            .json({
              message: `Line ${lineNum}: Cost center must be ≤ 20 characters`,
            });
        }
        if (!CODE_REGEX.test(ccId)) {
          await t.rollback();
          return res.status(400).json({
            message: `Line ${lineNum}: Cost center can only contain letters, numbers, hyphen, underscore, period`,
          });
        }
      }

      if (
        l.profitCenterId !== undefined &&
        l.profitCenterId !== null &&
        l.profitCenterId !== ""
      ) {
        const pcId = String(l.profitCenterId).trim();
        if (pcId.length > 20) {
          await t.rollback();
          return res
            .status(400)
            .json({
              message: `Line ${lineNum}: Profit center must be ≤ 20 characters`,
            });
        }
        if (!CODE_REGEX.test(pcId)) {
          await t.rollback();
          return res.status(400).json({
            message: `Line ${lineNum}: Profit center can only contain letters, numbers, hyphen, underscore, period`,
          });
        }
      }

      // Narration (optional, max 255 chars, no control chars)
      if (
        l.narration !== undefined &&
        l.narration !== null &&
        l.narration !== ""
      ) {
        const narr = String(l.narration).trim();
        if (narr.length > 255) {
          await t.rollback();
          return res
            .status(400)
            .json({
              message: `Line ${lineNum}: Narration must be ≤ 255 characters`,
            });
        }
        if (/[\x00-\x1F\x7F]/.test(narr)) {
          await t.rollback();
          return res
            .status(400)
            .json({
              message: `Line ${lineNum}: Narration contains invalid control characters`,
            });
        }
      }
    } // end line loop

    // Balance check (after accumulation)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Debits and credits must be equal" });
    }

    // ---------- create records ----------
    // Document number generation inside transaction with lock
    const documentNumber = await generateDocNumber(t);

    const h = await JournalHeader.create(
      {
        documentNumber,
        documentDate,
        postingDate,
        documentType: dt,
        reference: ref,
        headerText: ht,
        companyCode: cc,
        status: st,
        createdBy: req.user?.username || "SYSTEM",
      },
      { transaction: t },
    );

    console.log("Created header id:", h.id);

    let lineNo = 10;
    for (const l of lines) {
      const payload = {
        journalId: h.id,
        lineNo,
        glAccount: String(l.glAccount).trim(),
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        costCenterId: l.costCenterId?.toString().trim() || null,
        profitCenterId: l.profitCenterId?.toString().trim() || null,
        narration: l.narration?.toString().trim() || "",
      };
      console.log("JournalLine payload:", payload);

      await JournalLine.create(payload, { transaction: t });
      lineNo += 10;
    }

    await t.commit();
    res.status(201).json({ documentNumber });
  } catch (err) {
    if (t) await t.rollback();
    console.error("Journal create error", err);
    res.status(500).json({ message: "Failed to post journal" });
  }
};

// ------------------------------------------------------------------
// GET /api/journal/:id/lines  -> header + lines
// ------------------------------------------------------------------
exports.lines = async (req, res) => {
  try {
    const header = await JournalHeader.findByPk(req.params.id);
    if (!header) return res.status(404).json({ message: "Journal not found" });

    const lines = await JournalLine.findAll({
      where: { journalId: header.id },
      order: [["lineNo", "ASC"]],
    });

    res.json({ header, lines });
  } catch (err) {
    console.error("Journal lines error", err);
    res.status(500).json({ message: "Failed to load lines" });
  }
};
