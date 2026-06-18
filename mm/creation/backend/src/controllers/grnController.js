// backend/src/controllers/grnController.js
import db from "../config/db.js";
import { Invoice } from "../models/Invoice.js";
import axios from "axios";
const INTEGRATION_HUB = "http://localhost:3000";

const toMysqlDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(value).toISOString().split("T")[0];
};

// GET all GRNs (for table)
export const getGRNs = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT g.*, v.name AS vendor_name, p.po_no
       FROM grn_headers g
       LEFT JOIN vendors v ON g.vendor_id = v.id
       LEFT JOIN purchase_orders p ON g.po_id = p.id
       ORDER BY g.id DESC`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET one GRN (for edit)
export const getGRNById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[header]] = await db.query(
      `SELECT * FROM grn_headers WHERE id = ?`,
      [id],
    );
    if (!header) {
      return res.status(404).json({ message: "GRN not found" });
    }
    const [items] = await db.query(`SELECT * FROM grn_items WHERE grn_id = ?`, [
      id,
    ]);
    res.json({ header, items });
  } catch (err) {
    next(err);
  }
};

export const createGRN = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { header, items } = req.body;
    await conn.beginTransaction();

    // Generate GRN number (GRN-001, GRN-002...)
    const [rows] = await conn.query(
      `SELECT grn_no FROM grn_headers WHERE grn_no LIKE 'GRN-%' ORDER BY id DESC LIMIT 1`,
    );
    let nextSeq = 1;
    if (rows.length && rows[0].grn_no) {
      const parts = rows[0].grn_no.split("-");
      if (parts.length === 2 && !isNaN(parts[1])) {
        nextSeq = parseInt(parts[1], 10) + 1;
      }
    }
    const generatedGrnNo = `GRN-${String(nextSeq).padStart(3, "0")}`;

    // Insert GRN header
    const [hRes] = await conn.query(
      `INSERT INTO grn_headers
       (grn_no, grn_date, po_id, vendor_id, location_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        generatedGrnNo,
        toMysqlDate(header.grn_date),
        header.po_id,
        header.vendor_id,
        header.location_id,
        header.status || "POSTED",
      ],
    );
    const grnId = hRes.insertId;

    // Process each GRN item
    for (const item of items || []) {
      // 1. Check cumulative accepted quantity
      const [cumulative] = await conn.query(
        `SELECT COALESCE(SUM(gi.accepted_qty), 0) AS already_received
         FROM grn_items gi
         JOIN grn_headers gh ON gi.grn_id = gh.id
         WHERE gi.po_item_id = ? AND gh.status != 'CANCELLED'`,
        [item.po_item_id],
      );
      const alreadyReceived = cumulative[0].already_received;

      const [poItemRow] = await conn.query(
        `SELECT qty FROM po_items WHERE id = ?`,
        [item.po_item_id],
      );
      const orderedQty = poItemRow[0]?.qty || 0;
      const newAccepted = Number(item.accepted_qty);

      if (alreadyReceived + newAccepted > orderedQty) {
        await conn.rollback();
        return res.status(400).json({
          error: `Cannot accept ${newAccepted}. Already received ${alreadyReceived} of ${orderedQty}.`,
        });
      }

      // 2. Create batch
      const [bRes] = await conn.query(
        `INSERT INTO batches
         (batch_no, material_id, mfg_date, expiry_date, source_type, source_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.batch_no,
          item.material_id,
          toMysqlDate(item.mfg_date),
          toMysqlDate(item.expiry_date),
          "VENDOR",
          header.vendor_id,
        ],
      );
      const batchId = bRes.insertId;

      // 3. Insert GRN item
      await conn.query(
        `INSERT INTO grn_items
         (grn_id, po_item_id, material_id, received_qty, accepted_qty, rejected_qty, batch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          grnId,
          item.po_item_id,
          item.material_id,
          item.received_qty,
          item.accepted_qty,
          item.rejected_qty,
          batchId,
        ],
      );

      // 4. Stock ledger entry
      await conn.query(
        `INSERT INTO stock_ledger
         (material_id, location_id, batch_id, txn_type, qty_in, qty_out, unit_cost, txn_ref_type, txn_ref_id, txn_date)
         VALUES (?, ?, ?, 'GRN', ?, 0, ?, 'GRN', ?, ?)`,
        [
          item.material_id,
          header.location_id,
          batchId,
          item.accepted_qty,
          item.unit_cost || 0,
          grnId,
          toMysqlDate(header.grn_date),
        ],
      );
    }

    // ----- After all items, check if PO is fully received -----
    const [remaining] = await conn.query(
      `SELECT 
          pi.id,
          pi.qty - COALESCE(SUM(gi.accepted_qty), 0) AS remaining_qty
       FROM po_items pi
       LEFT JOIN grn_items gi ON gi.po_item_id = pi.id
       LEFT JOIN grn_headers gh ON gi.grn_id = gh.id AND gh.status != 'CANCELLED'
       WHERE pi.po_id = ?
       GROUP BY pi.id`,
      [header.po_id],
    );

    const allCompleted = remaining.every((r) => r.remaining_qty <= 0);
    if (allCompleted) {
      // Update PO status
      await conn.query(
        `UPDATE purchase_orders SET status = 'COMPLETED' WHERE id = ?`,
        [header.po_id],
      );

      // ----- Also update the linked PR status -----
      const [[poRow]] = await conn.query(
        `SELECT source_type, source_id FROM purchase_orders WHERE id = ?`,
        [header.po_id],
      );

      if (poRow) {
        if (poRow.source_type === "PR" && poRow.source_id) {
          await conn.query(
            `UPDATE purchase_requisitions SET status = 'COMPLETED' WHERE id = ?`,
            [poRow.source_id],
          );
        } else if (poRow.source_type === "RFQ" && poRow.source_id) {
          const [[rfqRow]] = await conn.query(
            `SELECT reference_pr_id FROM rfq_headers WHERE id = ?`,
            [poRow.source_id],
          );
          if (rfqRow && rfqRow.reference_pr_id) {
            const [[prRow]] = await conn.query(
              `SELECT id FROM purchase_requisitions WHERE req_no = ?`,
              [rfqRow.reference_pr_id],
            );
            if (prRow) {
              await conn.query(
                `UPDATE purchase_requisitions SET status = 'COMPLETED' WHERE id = ?`,
                [prRow.id],
              );
            }
          }
        }
      }

      // ------------------------------
      // 🚀 AUTO‑CREATE INVOICE AFTER GRN
      // ------------------------------
      // Check if an invoice already exists for this PO to avoid duplicates
      const [existingInvoice] = await conn.query(
        `SELECT id FROM vendor_invoices WHERE po_id = ? LIMIT 1`,
        [header.po_id],
      );
      if (existingInvoice.length === 0) {
        // 1. Get PO details
        const [[poDetails]] = await conn.query(
          `SELECT vendor_id, po_no, currency FROM purchase_orders WHERE id = ?`,
          [header.po_id],
        );

        // 2. Generate invoice number
        const [invRows] = await conn.query(
          `SELECT invoice_no FROM vendor_invoices WHERE invoice_no LIKE 'INV-%' ORDER BY id DESC LIMIT 1`,
        );
        let invNextSeq = 1;
        if (invRows.length && invRows[0].invoice_no) {
          const parts = invRows[0].invoice_no.split("-");
          const num = parseInt(parts[1], 10);
          if (!isNaN(num)) invNextSeq = num + 1;
        }
        const invoiceNo = `INV-${String(invNextSeq).padStart(3, "0")}`;

        // 3. Prepare invoice items from GRN items (accepted_qty + unit_cost)
        let totalAmount = 0;
        const invoiceItems = [];
        for (const item of items) {
          const accepted = Number(item.accepted_qty) || 0;
          const unitCost = Number(item.unit_cost) || 0;
          const itemTotal = accepted * unitCost;
          totalAmount += itemTotal;
          invoiceItems.push({
            po_item_id: item.po_item_id,
            material_id: item.material_id,
            qty: accepted,
            price: unitCost,
            tax_percent: 0, // you can enhance to fetch tax from po_items if needed
          });
        }

        // 4. Insert invoice header
        const [invRes] = await Invoice.createHeader(
          {
            invoice_no: invoiceNo,
            invoice_date: new Date().toISOString().slice(0, 10),
            vendor_id: poDetails.vendor_id,
            po_id: header.po_id,
            total_amount: totalAmount,
            status: "PENDING",
            invoice_type: "INVOICE",
            gr_based: 1, // GR‑based invoice
            payment_blocked: 0,
          },
          conn,
        );
        const invoiceId = invRes.insertId;

        // 5. Insert invoice items
        for (const invItem of invoiceItems) {
          await Invoice.createItem(invItem, invoiceId, conn);
        }

        // (Optional) You could also update PO status to 'INVOICED' if you add that status
        await conn.query(
          `UPDATE purchase_orders SET status = 'INVOICED' WHERE id = ?`,
          [header.po_id],
        );
      }
    }

    await conn.commit();

    // ============================================
    //  STOCK SYNC AFTER GRN
    // ============================================
    try {
      // Get material numbers from GRN items
      for (const item of items || []) {
        const [material] = await conn.query(
          "SELECT material_number, name FROM materials WHERE id = ?",
          [item.material_id],
        );

        if (material.length > 0 && material[0].material_number) {
          // Get total stock from stock_ledger
          const [stock] = await conn.query(
            `SELECT COALESCE(SUM(qty_in) - SUM(qty_out), 0) as total 
         FROM stock_ledger 
         WHERE material_id = ?`,
            [item.material_id],
          );

          await axios.post(`${INTEGRATION_HUB}/api/stock/sync`, {
            material_code: material[0].material_number,
            quantity: Number(stock[0].total),
            module: "mm_creation",
          });
          console.log(
            `✅ Stock sync from MM Creation GRN: ${material[0].material_number} → ${stock[0].total}`,
          );
        }
      }
    } catch (err) {
      console.error("Stock sync webhook failed:", err.message);
      // Don't fail the GRN creation
    }
    res.status(201).json({ id: grnId, grn_no: generatedGrnNo });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// UPDATE GRN
export const updateGRN = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const { header, items } = req.body;
    await conn.beginTransaction();

    await conn.query(
      `UPDATE grn_headers
       SET grn_date = ?, po_id = ?, vendor_id = ?, location_id = ?, status = ?
       WHERE id = ?`,
      [
        toMysqlDate(header.grn_date),
        header.po_id,
        header.vendor_id,
        header.location_id,
        header.status || "POSTED",
        id,
      ],
    );

    // delete old items + batches + ledger
    const [oldItems] = await conn.query(
      `SELECT batch_id FROM grn_items WHERE grn_id = ?`,
      [id],
    );
    const batchIds = oldItems.map((r) => r.batch_id).filter(Boolean);

    if (batchIds.length) {
      await conn.query(
        `DELETE FROM stock_ledger WHERE txn_ref_type = 'GRN' AND txn_ref_id = ?`,
        [id],
      );
      await conn.query(
        `DELETE FROM batches WHERE id IN (${batchIds
          .map(() => "?")
          .join(",")})`,
        batchIds,
      );
    }

    await conn.query(`DELETE FROM grn_items WHERE grn_id = ?`, [id]);

    // insert new items + ledger
    for (const item of items || []) {
      const [bRes] = await conn.query(
        `INSERT INTO batches
         (batch_no, material_id, mfg_date, expiry_date, source_type, source_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.batch_no,
          item.material_id,
          toMysqlDate(item.mfg_date),
          toMysqlDate(item.expiry_date),
          "VENDOR",
          header.vendor_id,
        ],
      );
      const batchId = bRes.insertId;

      await conn.query(
        `INSERT INTO grn_items
         (grn_id, po_item_id, material_id, received_qty, accepted_qty, rejected_qty, batch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.po_item_id,
          item.material_id,
          item.received_qty,
          item.accepted_qty,
          item.rejected_qty,
          batchId,
        ],
      );

      await conn.query(
        `INSERT INTO stock_ledger
         (material_id, location_id, batch_id, txn_type, qty_in, qty_out,
          unit_cost, txn_ref_type, txn_ref_id, txn_date)
         VALUES (?, ?, ?, 'GRN', ?, 0, ?, 'GRN', ?, ?)`,
        [
          item.material_id,
          header.location_id,
          batchId,
          item.accepted_qty,
          item.unit_cost || 0,
          id,
          toMysqlDate(header.grn_date),
        ],
      );
    }

    await conn.commit();
    res.json({ message: "GRN updated" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// DELETE GRN
export const deleteGRN = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    await conn.beginTransaction();

    const [items] = await conn.query(
      `SELECT batch_id FROM grn_items WHERE grn_id = ?`,
      [id],
    );
    const batchIds = items.map((r) => r.batch_id).filter(Boolean);

    await conn.query(
      `DELETE FROM stock_ledger WHERE txn_ref_type = 'GRN' AND txn_ref_id = ?`,
      [id],
    );
    await conn.query(`DELETE FROM grn_items WHERE grn_id = ?`, [id]);

    if (batchIds.length) {
      await conn.query(
        `DELETE FROM batches WHERE id IN (${batchIds
          .map(() => "?")
          .join(",")})`,
        batchIds,
      );
    }

    const [result] = await conn.query(`DELETE FROM grn_headers WHERE id = ?`, [
      id,
    ]);
    await conn.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "GRN not found" });
    }

    res.status(204).end();
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
