// // backend/src/controllers/grController.js
// import db from "../config/db.js";
// import { GR } from "../models/grModel.js";

// const toMysqlDate = (value) => {
//   if (!value) return null;
//   if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
//   return new Date(value).toISOString().split("T")[0];
// };

// // GET all GRs
// export const getGRs = async (req, res, next) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT g.*, p.po_no
//        FROM gr_headers g
//        LEFT JOIN purchase_orders p ON g.po_id = p.id
//        ORDER BY g.id DESC`
//     );
//     res.json(rows);
//   } catch (err) {
//     next(err);
//   }
// };

// // GET one GR
// export const getGRById = async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const [[header]] = await db.query(
//       `SELECT * FROM gr_headers WHERE id = ?`,
//       [id]
//     );
//     if (!header) {
//       return res.status(404).json({ message: "GR not found" });
//     }
//     const [items] = await db.query(
//       `SELECT * FROM gr_items WHERE gr_id = ?`,
//       [id]
//     );
//     res.json({ header, items });
//   } catch (err) {
//     next(err);
//   }
// };

// // CREATE GR (auto number)
// export const createGR = async (req, res, next) => {
//   const conn = await db.getConnection();
//   try {
//     const { header, items } = req.body;
//     await conn.beginTransaction();

//     // auto-generate GR number like GR-001
//     const [rows] = await conn.query(
//       `SELECT gr_no
//        FROM gr_headers
//        WHERE gr_no LIKE 'GR-%'
//        ORDER BY id DESC
//        LIMIT 1`
//     );
//     let nextSeq = 1;
//     if (rows.length && rows[0].gr_no) {
//       const parts = rows[0].gr_no.split("-");
//       if (parts.length === 2 && !isNaN(parts[1])) {
//         nextSeq = parseInt(parts[1], 10) + 1;
//       }
//     }
//     const generatedGrNo = `GR-${String(nextSeq).padStart(3, "0")}`;

//     // header
//     const [hRes] = await GR.createHeader(
//       {
//         ...header,
//         gr_no: generatedGrNo,
//         doc_date: toMysqlDate(header.doc_date),
//         posting_date: toMysqlDate(header.posting_date)
//       },
//       conn
//     );
//     const grId = hRes.insertId;

//     // items + stock ledger
//     for (const item of items || []) {
//       await GR.createItem(
//         {
//           ...item,
//           qty: item.qty
//         },
//         grId,
//         conn
//       );

//       // stock ledger (in)
//       await conn.query(
//         `INSERT INTO stock_ledger
//          (material_id, location_id, batch_id, txn_type, qty_in, qty_out,
//           unit_cost, txn_ref_type, txn_ref_id, txn_date)
//          VALUES (?, ?, NULL, 'GR', ?, 0, ?, 'GR', ?, ?)`,
//         [
//           item.material_id,
//           header.location_id || 1,       // if you have a location_id in header
//           item.qty,
//           item.unit_cost || 0 || 0,      // if you track cost
//           grId,
//           toMysqlDate(header.posting_date)
//         ]
//       );
//     }

//     await conn.commit();
//     res.status(201).json({ id: grId, gr_no: generatedGrNo });
//   } catch (err) {
//     await conn.rollback();
//     next(err);
//   } finally {
//     conn.release();
//   }
// };

// // UPDATE GR
// export const updateGR = async (req, res, next) => {
//   const conn = await db.getConnection();
//   try {
//     const id = req.params.id;
//     const { header, items } = req.body;
//     await conn.beginTransaction();

//     await conn.query(
//       `UPDATE gr_headers
//        SET doc_date = ?, posting_date = ?, po_id = ?, plant = ?, status = ?
//        WHERE id = ?`,
//       [
//         toMysqlDate(header.doc_date),
//         toMysqlDate(header.posting_date),
//         header.po_id,
//         header.plant,
//         header.status || "POSTED",
//         id
//       ]
//     );

//     // delete old ledger + items
//     await conn.query(
//       `DELETE FROM stock_ledger
//        WHERE txn_ref_type = 'GR' AND txn_ref_id = ?`,
//       [id]
//     );
//     await conn.query(
//       `DELETE FROM gr_items WHERE gr_id = ?`,
//       [id]
//     );

//     // insert new items + ledger
//     for (const item of items || []) {
//       await GR.createItem(item, id, conn);

//       await conn.query(
//         `INSERT INTO stock_ledger
//          (material_id, location_id, batch_id, txn_type, qty_in, qty_out,
//           unit_cost, txn_ref_type, txn_ref_id, txn_date)
//          VALUES (?, ?, NULL, 'GR', ?, 0, ?, 'GR', ?, ?)`,
//         [
//           item.material_id,
//           header.location_id || 1,
//           item.qty,
//           item.unit_cost || 0,
//           id,
//           toMysqlDate(header.posting_date)
//         ]
//       );
//     }

//     await conn.commit();
//     res.json({ message: "GR updated" });
//   } catch (err) {
//     await conn.rollback();
//     next(err);
//   } finally {
//     conn.release();
//   }
// };

// // DELETE GR
// export const deleteGR = async (req, res, next) => {
//   const conn = await db.getConnection();
//   try {
//     const id = req.params.id;
//     await conn.beginTransaction();

//     await conn.query(
//       `DELETE FROM stock_ledger
//        WHERE txn_ref_type = 'GR' AND txn_ref_id = ?`,
//       [id]
//     );
//     await conn.query(
//       `DELETE FROM gr_items WHERE gr_id = ?`,
//       [id]
//     );
//     const [result] = await conn.query(
//       `DELETE FROM gr_headers WHERE id = ?`,
//       [id]
//     );

//     await conn.commit();

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "GR not found" });
//     }

//     res.status(204).end();
//   } catch (err) {
//     await conn.rollback();
//     next(err);
//   } finally {
//     conn.release();
//   }
// };
