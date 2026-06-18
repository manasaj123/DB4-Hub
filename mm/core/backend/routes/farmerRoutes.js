import express from "express";
import db from "../config/db.js";

const router = express.Router();

// ============================================
// GET - Get ALL farmers (ONLY type = 'FARMER')
// ============================================
router.get("/", (req, res) => {
  // ✅ STRICTLY only return farmers (type = 'FARMER')
  const sql = "SELECT * FROM farmers WHERE type = 'FARMER' ORDER BY id DESC";
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error("❌ Fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch farmers" });
    }
    res.json(data);
  });
});

// ============================================
// GET - Get farmer by ID (only if FARMER)
// ============================================
router.get("/:id", (req, res) => {
  const { id } = req.params;
  
  db.query("SELECT * FROM farmers WHERE id = ? AND type = 'FARMER'", [id], (err, data) => {
    if (err) {
      console.error("❌ Fetch error:", err);
      return res.status(500).json({ error: "Failed to fetch farmer" });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: "Farmer not found" });
    }
    
    res.json(data[0]);
  });
});

// ============================================
// POST - Add new farmer (ALWAYS type = 'FARMER')
// ============================================
router.post("/", (req, res) => {
  const { farmerCode, name, village, district, bankAccount, address, contact } = req.body;

  // Validation
  if (!farmerCode || !name || !address || !contact) {
    return res.status(400).json({ error: "Required fields: farmerCode, name, address, contact" });
  }

  // Validate name
  if (!/^[A-Za-z][A-Za-z\s'-]{2,}$/.test(name)) {
    return res.status(400).json({ error: "Invalid name format" });
  }

  // Validate contact
  if (!/^[6-9]\d{9}$/.test(contact)) {
    return res.status(400).json({ error: "Invalid contact number" });
  }

  // Check duplicate farmer code
  db.query(
    "SELECT id FROM farmers WHERE farmer_code = ?",
    [farmerCode],
    (err, results) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: "Farmer code already exists" });
      }

      // Check duplicate contact
      db.query(
        "SELECT id FROM farmers WHERE contact = ?",
        [contact],
        (err, contactResults) => {
          if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ error: "Database error" });
          }

          if (contactResults.length > 0) {
            return res.status(400).json({ error: "Contact number already registered" });
          }

          // ✅ ALWAYS set type to 'FARMER'
          const sql = `
            INSERT INTO farmers 
            (farmer_code, name, village, district, bank_account, address, contact, type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            sql,
            [farmerCode, name.trim(), village || null, district || null, bankAccount || null, address.trim(), contact, 'FARMER'],
            (err, result) => {
              if (err) {
                console.error("❌ Insert error:", err);
                return res.status(500).json({ error: "Failed to add farmer" });
              }

              console.log(`✅ Farmer added with ID: ${result.insertId}, Code: ${farmerCode}`);

              res.status(201).json({
                id: result.insertId,
                farmerCode,
                name,
                type: 'FARMER',
                message: "Farmer added successfully"
              });
            }
          );
        }
      );
    }
  );
});

// ============================================
// PUT - Update farmer (only if FARMER)
// ============================================
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, village, district, bankAccount, address, contact } = req.body;
  
  if (!name || !address || !contact) {
    return res.status(400).json({ error: "Name, address, and contact are required" });
  }
  
  // ✅ Only update if type is 'FARMER'
  const sql = `
    UPDATE farmers 
    SET name = ?, village = ?, district = ?, bank_account = ?, address = ?, contact = ?
    WHERE id = ? AND type = 'FARMER'
  `;
  
  db.query(
    sql,
    [name.trim(), village || null, district || null, bankAccount || null, address.trim(), contact, id],
    (err, result) => {
      if (err) {
        console.error("❌ Update error:", err);
        return res.status(500).json({ error: "Failed to update farmer" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Farmer not found" });
      }
      
      console.log(`✅ Farmer updated: ID ${id}`);
      res.json({ message: "Farmer updated successfully" });
    }
  );
});

// ============================================
// DELETE - Delete farmer (only if FARMER)
// ============================================
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  
  // ✅ Only delete if type is 'FARMER'
  db.query("DELETE FROM farmers WHERE id = ? AND type = 'FARMER'", [id], (err, result) => {
    if (err) {
      console.error("❌ Delete error:", err);
      return res.status(500).json({ error: "Failed to delete farmer" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Farmer not found" });
    }
    
    console.log(`✅ Farmer deleted: ID ${id}`);
    res.json({ message: "Farmer deleted successfully" });
  });
});

export default router;