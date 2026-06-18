import db from "../config/db.js";

// ============================================
// Add Farmer/Vendor
// ============================================
export const addFarmer = (req, res) => {
  const { 
    name, 
    address, 
    contact, 
    village, 
    district, 
    bankAccount, 
    farmerCode,
    type 
  } = req.body;
  
  // Normalize type
  const normalizedType = (type && type.toUpperCase() === 'VENDOR') ? 'VENDOR' : 'FARMER';

  // Check if farmer already exists
  db.query(
    "SELECT * FROM farmers WHERE name = ? AND contact = ?",
    [name, contact],
    (err, results) => {
      if (err) {
        console.error("❌ Check existing error:", err);
        return res.status(500).json({ error: err.message });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ 
          error: `${normalizedType} already exists with this name and contact` 
        });
      }
      
      // Insert new farmer/vendor
      const sql = `
        INSERT INTO farmers 
        (name, address, contact, village, district, bank_account, farmer_code, type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(
        sql,
        [
          name, 
          address, 
          contact, 
          village || null, 
          district || null, 
          bankAccount || null, 
          farmerCode || null, 
          normalizedType
        ],
        (err, result) => {
          if (err) {
            console.error("❌ Add farmer error:", err);
            return res.status(500).json({ error: err.message });
          }
          
          console.log(`✅ ${normalizedType} added with ID: ${result.insertId}`);
          
          res.json({ 
            id: result.insertId, 
            farmer_code: farmerCode,
            type: normalizedType,
            message: `${normalizedType} added successfully` 
          });
        }
      );
    }
  );
};

// ============================================
// Get All Farmers/Vendors
// ============================================
export const getFarmers = (req, res) => {
  const { type } = req.query;
  
  let sql = "SELECT * FROM farmers";
  const params = [];
  
  if (type && (type.toUpperCase() === 'FARMER' || type.toUpperCase() === 'VENDOR')) {
    sql += " WHERE type = ?";
    params.push(type.toUpperCase());
  }
  
  sql += " ORDER BY id DESC";
  
  db.query(sql, params, (err, data) => {
    if (err) {
      console.error("❌ Get farmers error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(data);
  });
};

// ============================================
// Get Farmer/Vendor by ID
// ============================================
export const getFarmerById = (req, res) => {
  const { id } = req.params;
  
  db.query("SELECT * FROM farmers WHERE id = ?", [id], (err, data) => {
    if (err) {
      console.error("❌ Get farmer error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (data.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(data[0]);
  });
};

// ============================================
// Update Farmer/Vendor
// ============================================
export const updateFarmer = (req, res) => {
  const { id } = req.params;
  const { name, address, contact, village, district, bankAccount, type } = req.body;
  
  const normalizedType = (type && type.toUpperCase() === 'VENDOR') ? 'VENDOR' : 'FARMER';
  
  const sql = `
    UPDATE farmers 
    SET name = ?, 
        address = ?, 
        contact = ?, 
        village = ?, 
        district = ?, 
        bank_account = ?, 
        type = ?
    WHERE id = ?
  `;
  
  db.query(
    sql,
    [
      name, 
      address, 
      contact, 
      village || null, 
      district || null, 
      bankAccount || null, 
      normalizedType, 
      id
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Update farmer error:", err);
        return res.status(500).json({ error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      res.json({ 
        message: `${normalizedType} updated successfully`,
        type: normalizedType
      });
    }
  );
};

// ============================================
// Delete Farmer/Vendor
// ============================================
export const deleteFarmer = (req, res) => {
  const { id } = req.params;
  
  db.query("DELETE FROM farmers WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("❌ Delete farmer error:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    
    res.json({ message: "Deleted successfully" });
  });
};