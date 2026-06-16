import db from "../config/db.js";

export const addCustomer = (req, res) => {
  const { name, address, contact } = req.body;

  db.query(
    "INSERT INTO customers (name,address,contact) VALUES (?,?,?)",
    [name, address, contact],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ id: result.insertId, name, address, contact });
    }
  );
};

export const getCustomers = (req, res) => {
  db.query("SELECT * FROM customers", (err, data) => {
    if (err) return res.status(500).json(err);
    res.json(data);
  });
};

