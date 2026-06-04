// // backend/src/models/grModel.js
// import db from "../config/db.js";

// export const GR = {
//   createHeader(data, conn = db) {
//     const { gr_no, doc_date, posting_date, po_id, plant, status } = data;
//     return conn.query(
//       `INSERT INTO gr_headers
//        (gr_no, doc_date, posting_date, po_id, plant, status)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [gr_no, doc_date, posting_date, po_id, plant, status || "POSTED"]
//     );
//   },

//   createItem(item, grId, conn = db) {
//     const {
//       po_item_id,
//       material_id,
//       material_desc,
//       qty,
//       storage_location,
//       stock_type
//     } = item;
//     return conn.query(
//       `INSERT INTO gr_items
//        (gr_id, po_item_id, material_id, material_desc, qty, storage_location, stock_type)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [grId, po_item_id, material_id, material_desc, qty, storage_location, stock_type]
//     );
//   }
// };
