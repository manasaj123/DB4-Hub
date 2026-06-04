import db from "../config/db.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";

// Helper: generate next PO number like DB4-PO-001, DB4-PO-002, ...
const generatePONumber = async () => {
  const [rows] = await db.query(
    `SELECT MAX(CAST(SUBSTRING(po_no, 8) AS UNSIGNED)) AS max_num
     FROM purchase_orders
     WHERE po_no LIKE 'DB4-PO-%'`,
  );
  const maxNum = rows[0]?.max_num || 0;
  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, "0");
  return `DB4-PO-${padded}`;
};

export const getPOs = async (req, res, next) => {
  try {
    const [rows] = await PurchaseOrder.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getPOById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[header]] = await PurchaseOrder.findById(id);
    const [items] = await PurchaseOrder.findItems(id);
    res.json({ header, items });
  } catch (err) {
    next(err);
  }
};

// export const createPO = async (req, res, next) => {
//   const conn = await db.getConnection();
//   try {
//     const { header, items } = req.body;
//     await conn.beginTransaction();

//     // Generate PO number if not provided
//     const po_no = header.po_no?.trim()
//       ? header.po_no
//       : await generatePONumber();

//     //  Prevent duplicate PO for the same PR
//     if (header.source_type === "PR" && header.source_id) {
//       const [existing] = await conn.query(
//         `SELECT id FROM purchase_orders
//          WHERE source_type = 'PR' AND source_id = ?`,
//         [header.source_id],
//       );
//       if (existing.length > 0) {
//         await conn.rollback();
//         return res
//           .status(400)
//           .json({ error: "A PO already exists for this Purchase Requisition" });
//       }
//     }

//     // Prevent duplicate PO for the same RFQ
//     if (header.source_type === "RFQ" && header.source_id) {
//       const [existing] = await conn.query(
//         `SELECT id FROM purchase_orders
//      WHERE source_type = 'RFQ' AND source_id = ?`,
//         [header.source_id],
//       );
//       if (existing.length > 0) {
//         await conn.rollback();
//         return res
//           .status(400)
//           .json({ error: "A PO already exists for this RFQ" });
//       }
//     }

//     // Insert PO header (includes source_id)
//     const [hRes] = await conn.query(
//       `INSERT INTO purchase_orders
//        (po_no, po_date, vendor_id, status, payment_terms, currency, po_type, source_type, source_id, freight_charges)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         po_no,
//         header.po_date,
//         header.vendor_id,
//         header.status || "OPEN",
//         header.payment_terms,
//         header.currency || "INR",
//         header.po_type || "STOCK",
//         header.source_type || "DIRECT",
//         header.source_id || null, // store the source PR id
//         header.freight_charges || 0,
//       ],
//     );
//     const poId = hRes.insertId;

//     // Insert PO items
//     for (const item of items || []) {
//       await conn.query(
//         `INSERT INTO po_items
//          (po_id, material_id, qty, price, tax_percent, delivery_date)
//          VALUES (?, ?, ?, ?, ?, ?)`,
//         [
//           poId,
//           item.material_id,
//           item.qty,
//           item.price,
//           item.tax_percent || 0,
//           item.delivery_date || null,
//         ],
//       );
//     }

//     // Update RFQ status to 'Closed' if source is RFQ
//     if (header.source_type === "RFQ" && header.source_id) {
//       await conn.query(
//         `UPDATE rfq_headers SET status = 'Closed' WHERE id = ?`,
//         [header.source_id],
//       );
//     }

//     // Update PR status to 'PO_CREATED'
//     if (header.source_type === "PR" && header.source_id) {
//       await conn.query(
//         `UPDATE purchase_requisitions SET status = 'PO_CREATED' WHERE id = ?`,
//         [header.source_id],
//       );
//     }

//     await conn.commit();
//     res.status(201).json({ id: poId, po_no });
//   } catch (err) {
//     await conn.rollback();
//     next(err);
//   } finally {
//     conn.release();
//   }
// };

export const createPO = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { header, items } = req.body;
    await conn.beginTransaction();

    // Generate PO number if not provided
    const po_no = header.po_no?.trim()
      ? header.po_no
      : await generatePONumber();

    // Prevent duplicate PO for the same PR
    if (header.source_type === "PR" && header.source_id) {
      const [existing] = await conn.query(
        `SELECT id FROM purchase_orders 
         WHERE source_type = 'PR' AND source_id = ?`,
        [header.source_id],
      );
      if (existing.length > 0) {
        await conn.rollback();
        return res
          .status(400)
          .json({ error: "A PO already exists for this Purchase Requisition" });
      }
    }

    // Prevent duplicate PO for the same RFQ
    if (header.source_type === "RFQ" && header.source_id) {
      const [existing] = await conn.query(
        `SELECT id FROM purchase_orders 
         WHERE source_type = 'RFQ' AND source_id = ?`,
        [header.source_id],
      );
      if (existing.length > 0) {
        await conn.rollback();
        return res
          .status(400)
          .json({ error: "A PO already exists for this RFQ" });
      }
    }

    // Insert PO header (includes source_id)
    const [hRes] = await conn.query(
      `INSERT INTO purchase_orders
       (po_no, po_date, vendor_id, status, payment_terms, currency, po_type, source_type, source_id, freight_charges)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        po_no,
        header.po_date,
        header.vendor_id,
        header.status || "OPEN",
        header.payment_terms,
        header.currency || "INR",
        header.po_type || "STOCK",
        header.source_type || "DIRECT",
        header.source_id || null,
        header.freight_charges || 0,
      ],
    );
    const poId = hRes.insertId;

    // Insert PO items
    for (const item of items || []) {
      await conn.query(
        `INSERT INTO po_items
         (po_id, material_id, qty, price, tax_percent, delivery_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          poId,
          item.material_id,
          item.qty,
          item.price,
          item.tax_percent || 0,
          item.delivery_date || null,
        ],
      );
    }

    // ----- Status updates -----

    // 1. Update RFQ status to 'Closed' if source is RFQ
    if (header.source_type === "RFQ" && header.source_id) {
      await conn.query(
        `UPDATE rfq_headers SET status = 'Closed' WHERE id = ?`,
        [header.source_id],
      );

      // 2. Also update the linked PR status (if the RFQ references a PR)
      const [[rfqRow]] = await conn.query(
        `SELECT reference_pr_id FROM rfq_headers WHERE id = ?`,
        [header.source_id],
      );
      if (rfqRow && rfqRow.reference_pr_id) {
        // Find the PR id by req_no
        const [[prRow]] = await conn.query(
          `SELECT id FROM purchase_requisitions WHERE req_no = ?`,
          [rfqRow.reference_pr_id],
        );
        if (prRow) {
          await conn.query(
            `UPDATE purchase_requisitions SET status = 'PO_CREATED' WHERE id = ?`,
            [prRow.id],
          );
        }
      }
    }

    // 3. Update PR status directly if source is PR
    if (header.source_type === "PR" && header.source_id) {
      await conn.query(
        `UPDATE purchase_requisitions SET status = 'PO_CREATED' WHERE id = ?`,
        [header.source_id],
      );
    }

    await conn.commit();
    res.status(201).json({ id: poId, po_no });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const deletePO = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    // 1) delete invoice_items that reference po_items of this PO
    await conn.query(
      `DELETE ii FROM invoice_items ii
       JOIN po_items pi ON ii.po_item_id = pi.id
       WHERE pi.po_id = ?`,
      [id],
    );

    // 2) delete grn_items that reference po_items of this PO
    await conn.query(
      `DELETE gi FROM grn_items gi
       JOIN po_items pi ON gi.po_item_id = pi.id
       WHERE pi.po_id = ?`,
      [id],
    );

    // 3) delete po_items for this PO
    await conn.query("DELETE FROM po_items WHERE po_id = ?", [id]);

    // 4) delete vendor_invoices that reference this PO
    await conn.query("DELETE FROM vendor_invoices WHERE po_id = ?", [id]);

    // 5) delete GRN headers that reference this PO
    await conn.query("DELETE FROM grn_headers WHERE po_id = ?", [id]);

    // 6) delete the PO itself
    const [result] = await conn.query(
      "DELETE FROM purchase_orders WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "PO not found" });
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const updatePO = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { header, items } = req.body;
    await conn.beginTransaction();

    // optional safety: block items change when GRN exists
    const [grnRows] = await conn.query(
      `SELECT COUNT(*) AS cnt
       FROM grn_items gi
       JOIN po_items pi ON gi.po_item_id = pi.id
       WHERE pi.po_id = ?`,
      [id],
    );
    const hasGRN = grnRows[0].cnt > 0;

    // 1) update header
    await conn.query(
      `UPDATE purchase_orders
       SET po_no = ?, po_date = ?, vendor_id = ?, status = ?, payment_terms = ?, 
           currency = ?, po_type = ?, source_type = ?, freight_charges = ?
       WHERE id = ?`,
      [
        header.po_no,
        header.po_date,
        header.vendor_id,
        header.status || "OPEN",
        header.payment_terms,
        header.currency || "INR",
        header.po_type || "STOCK",
        header.source_type || "DIRECT",
        header.freight_charges || 0,
        id,
      ],
    );

    // 2) only replace items when no GRN exists
    if (!hasGRN) {
      await conn.query("DELETE FROM po_items WHERE po_id = ?", [id]);

      for (const item of items || []) {
        await conn.query(
          `INSERT INTO po_items
             (po_id, material_id, qty, price, tax_percent, delivery_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.material_id,
            item.qty,
            item.price,
            item.tax_percent || 0,
            item.delivery_date || null,
          ],
        );
      }
    }

    await conn.commit();
    res.json({ success: true, itemsUpdated: !hasGRN });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
