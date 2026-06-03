import db from "../config/db.js";
import { RFQ } from "../models/RFQ.js";

const toMysqlDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* GET ALL RFQs with summary */
export const getRFQs = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT h.*, 
        COUNT(DISTINCT ri.id) as item_count,
        SUM(ri.qty) as total_qty,
        COUNT(DISTINCT rv.vendor_id) as vendor_count
       FROM rfq_headers h
       LEFT JOIN rfq_items ri ON h.id = ri.rfq_id
       LEFT JOIN rfq_vendors rv ON h.id = rv.rfq_id
       GROUP BY h.id
       ORDER BY h.id DESC`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* CREATE RFQ */
export const createRFQ = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { header, items, vendors } = req.body;
    await conn.beginTransaction();

    // generate RFQ number RFQ-001 style
    const [rows] = await conn.query(
      `SELECT rfq_no FROM rfq_headers 
       WHERE rfq_no LIKE 'RFQ-%'
       ORDER BY id DESC
       LIMIT 1`,
    );
    let nextSeq = 1;
    if (rows.length && rows[0].rfq_no) {
      const parts = rows[0].rfq_no.split("-");
      if (parts.length === 2 && !isNaN(parts[1])) {
        nextSeq = parseInt(parts[1], 10) + 1;
      }
    }
    const generatedRfqNo = `RFQ-${String(nextSeq).padStart(3, "0")}`;

    // Insert RFQ Header with ALL fields including new ones
    const [headerRes] = await conn.query(
      `INSERT INTO rfq_headers
        (rfq_no, rfq_type, rfq_date, question_deadline, purchase_org,
         delivery_date, material_group, plant, storage_location,
         vendor_id, supplying_plant, reference_pr_id, 
         status, quotation_valid_until, currency, payment_terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generatedRfqNo,
        header.rfq_type,
        toMysqlDate(header.rfq_date),
        toMysqlDate(header.question_deadline),
        header.purchase_org || null,
        toMysqlDate(header.delivery_date),
        header.material_group || null,
        header.plant || null,
        header.storage_location || null,
        null, // vendor_id is now handled in rfq_vendors table
        header.supplying_plant || null,
        header.reference_pr_id || null,
        header.status || "Draft",
        toMysqlDate(header.quotation_valid_until),
        header.currency || "USD",
        header.payment_terms || "Net 30",
      ],
    );

    const rfqId = headerRes.insertId;

    // Insert Items
    for (const item of items || []) {
      if (!item.material_id || !item.qty) continue;
      await conn.query(
        `INSERT INTO rfq_items
          (rfq_id, material_id, qty)
         VALUES (?, ?, ?)`,
        [rfqId, item.material_id, Number(item.qty)],
      );
    }

    // Insert Vendors (Multi-vendor support)
    if (vendors && vendors.length > 0) {
      for (const vendor of vendors) {
        if (!vendor.vendor_id) continue;
        await conn.query(
          `INSERT INTO rfq_vendors (rfq_id, vendor_id)
           VALUES (?, ?)`,
          [rfqId, vendor.vendor_id],
        );
      }
    }

    await conn.commit();
    res.status(201).json({
      id: rfqId,
      rfq_no: generatedRfqNo,
      message: "RFQ created successfully",
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* GET ONE RFQ with all relations */
export const getRFQById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[headerRow]] = await RFQ.findByIdHeader(id);

    if (!headerRow) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    const [itemRows] = await RFQ.findItemsByRFQ(id);

    // Get vendors for this RFQ
    const [vendorRows] = await db.query(
      `SELECT rv.id, rv.vendor_id, v.name as vendor_name
       FROM rfq_vendors rv
       JOIN vendors v ON rv.vendor_id = v.id
       WHERE rv.rfq_id = ?`,
      [id],
    );

    res.json({
      header: headerRow,
      items: itemRows,
      vendors: vendorRows,
    });
  } catch (err) {
    next(err);
  }
};

/* GET RFQ with full details + vendor quotes */
export const getRFQWithQuotes = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[header]] = await RFQ.findByIdHeader(id);
    if (!header) return res.status(404).json({ message: "RFQ not found" });

    const [items] = await RFQ.findItemsByRFQ(id);
    const [vendors] = await RFQ.findVendorsByRFQ(id);

    // Get quotes per vendor per item
    const [quotes] = await db.query(
      `SELECT q.*, v.name as vendor_name, i.material_id, i.qty as rfq_qty
       FROM rfq_vendor_quotes q
       JOIN rfq_items i ON q.rfq_item_id = i.id
       JOIN vendors v ON q.vendor_id = v.id
       WHERE q.rfq_id = ?`,
      [id],
    );

    res.json({ header, items, vendors, quotes });
  } catch (err) {
    next(err);
  }
};

/* UPDATE RFQ */
export const updateRFQ = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const { header, items, vendors } = req.body;
    await conn.beginTransaction();

    // Update RFQ Header with ALL fields
    await conn.query(
      `UPDATE rfq_headers
       SET rfq_type = ?,
           rfq_date = ?,
           question_deadline = ?,
           purchase_org = ?,
           delivery_date = ?,
           material_group = ?,
           plant = ?,
           storage_location = ?,
           vendor_id = ?,
           supplying_plant = ?,
           reference_pr_id = ?,
           status = ?,
           quotation_valid_until = ?,
           currency = ?,
           payment_terms = ?
       WHERE id = ?`,
      [
        header.rfq_type,
        toMysqlDate(header.rfq_date),
        toMysqlDate(header.question_deadline),
        header.purchase_org || null,
        toMysqlDate(header.delivery_date),
        header.material_group || null,
        header.plant || null,
        header.storage_location || null,
        null, // vendor_id is now handled in rfq_vendors table
        header.supplying_plant || null,
        header.reference_pr_id || null,
        header.status || "Draft",
        toMysqlDate(header.quotation_valid_until),
        header.currency || "USD",
        header.payment_terms || "Net 30",
        id,
      ],
    );

    // Update Items - delete existing and insert new
    await conn.query(`DELETE FROM rfq_items WHERE rfq_id = ?`, [id]);
    for (const item of items || []) {
      if (!item.material_id || !item.qty) continue;
      await conn.query(
        `INSERT INTO rfq_items (rfq_id, material_id, qty)
         VALUES (?, ?, ?)`,
        [id, item.material_id, Number(item.qty)],
      );
    }

    // Update Vendors - delete existing and insert new
    await conn.query(`DELETE FROM rfq_vendors WHERE rfq_id = ?`, [id]);
    if (vendors && vendors.length > 0) {
      for (const vendor of vendors) {
        if (!vendor.vendor_id) continue;
        await conn.query(
          `INSERT INTO rfq_vendors (rfq_id, vendor_id)
           VALUES (?, ?)`,
          [id, vendor.vendor_id],
        );
      }
    }

    await conn.commit();
    res.json({ message: "RFQ updated successfully" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* DELETE RFQ */
export const deleteRFQ = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();

    // Delete related records first (due to foreign keys)
    await conn.query(`DELETE FROM rfq_vendors WHERE rfq_id = ?`, [id]);
    await conn.query(`DELETE FROM rfq_items WHERE rfq_id = ?`, [id]);
    const [result] = await conn.query(`DELETE FROM rfq_headers WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "RFQ not found" });
    }

    await conn.commit();
    res.status(204).end();
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* SAVE/UPDATE vendor quotes for an RFQ */
export const saveVendorQuotes = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { rfq_id, vendor_id, quotes } = req.body; // quotes = [{ rfq_item_id, material_id, quoted_price, quoted_qty }]
    await conn.beginTransaction();

    // Delete existing quotes for this vendor & RFQ
    await conn.query(
      `DELETE FROM rfq_vendor_quotes WHERE rfq_id = ? AND vendor_id = ?`,
      [rfq_id, vendor_id],
    );

    // Insert new quotes
    for (const q of quotes) {
      await conn.query(
        `INSERT INTO rfq_vendor_quotes
         (rfq_id, vendor_id, rfq_item_id, material_id, quoted_price, quoted_qty)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          rfq_id,
          vendor_id,
          q.rfq_item_id,
          q.material_id,
          q.quoted_price,
          q.quoted_qty,
        ],
      );
    }

    await conn.commit();
    res.json({ success: true, message: "Quotes saved" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// Make sure getRFQWithQuotes is exported (if not already)
// It already exists in your code, but ensure it is exported:
// export const getRFQWithQuotes = async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const [[header]] = await RFQ.findByIdHeader(id);
//     if (!header) return res.status(404).json({ message: "RFQ not found" });

//     const [items] = await RFQ.findItemsByRFQ(id);
//     const [vendors] = await RFQ.findVendorsByRFQ(id);

//     const [quotes] = await db.query(
//       `SELECT q.*, v.name as vendor_name, i.material_id, i.qty as rfq_qty
//        FROM rfq_vendor_quotes q
//        JOIN rfq_items i ON q.rfq_item_id = i.id
//        JOIN vendors v ON q.vendor_id = v.id
//        WHERE q.rfq_id = ?`,
//       [id],
//     );

//     res.json({ header, items, vendors, quotes });
//   } catch (err) {
//     next(err);
//   }
// };
