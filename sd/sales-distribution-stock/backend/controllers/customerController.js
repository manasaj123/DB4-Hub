// backend/controllers/customerController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const axios = require("axios"); // ← ADD THIS

const INTEGRATION_HUB = "http://localhost:3000"; // ← ADD THIS

//validation
const validateCustomer = (data) => {
  const errors = {};

  const nameRegex = /^[A-Za-z\s]+$/;
  const cityRegex = /^[A-Za-z\s]+$/;
  const countryRegex = /^[A-Za-z\s]+$/;
  const customerCodeRegex = /^[A-Za-z0-9]+$/;
  const creditGroupRegex = /^[A-Za-z0-9\s]+$/;

  const requiredFields = [
    "customerCode",
    "name",
    "city",
    "country",
    "riskCategory",
  ];

  // 1. Required fields check
  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].toString().trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // 2. Customer Code rules
  if (data.customerCode) {
    if (!customerCodeRegex.test(data.customerCode)) {
      errors.customerCode =
        "Customer Code must be alphanumeric only (no spaces or special characters)";
    }

    if (data.customerCode.length > 20) {
      errors.customerCode = "Customer Code cannot exceed 20 characters";
    }
  }

  if (data.creditGroup) {
    if (!creditGroupRegex.test(data.creditGroup)) {
      errors.creditGroup =
        "Credit Group must contain only letters, numbers and spaces";
    }
  }

  // 2. Name rules
  if (data.name) {
    if (!nameRegex.test(data.name)) {
      errors.name = "Name must contain only letters and spaces";
    }
    if (data.name.length > 150) {
      errors.name = "Name cannot exceed 150 characters";
    }
  }

  // 3. City rules
  if (data.city && !cityRegex.test(data.city)) {
    errors.city = "City must contain only letters";
  }

  // 4. Country rules
  if (data.country) {
    if (!countryRegex.test(data.country)) {
      errors.country = "Country must contain only letters";
    }
    if (data.country.length > 3) {
      errors.country = "Country must be max 3 characters (e.g., IN, IND)";
    }
  }

  return errors;
};

// GET /api/customers
exports.getCustomers = asyncHandler(async (req, res) => {
  const list = await db.Customer.findAll({
    where: { isDeleted: false },
    order: [["id", "ASC"]],
  });
  res.json(list);
});

// GET /api/customers/deleted
exports.getDeletedCustomers = asyncHandler(async (req, res) => {
  const list = await db.Customer.findAll({
    where: { isDeleted: true },
    order: [["id", "ASC"]],
  });
  res.json(list);
});

// GET /api/customers/:id
exports.getCustomerById = asyncHandler(async (req, res) => {
  const customer = await db.Customer.findByPk(req.params.id);
  if (!customer) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }
  res.json(customer);
});

// POST /api/customers - CREATE (UPDATED WITH WEBHOOK)
exports.createCustomer = asyncHandler(async (req, res) => {
  try {
    req.body.customerCode = (req.body.customerCode || "").trim().toUpperCase();
    req.body.name = (req.body.name || "").trim();
    req.body.city = (req.body.city || "").trim();
    req.body.country = (req.body.country || "").trim().toUpperCase();
    req.body.creditGroup = (req.body.creditGroup || "").trim();

    const errors = validateCustomer(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const customer = await db.Customer.create(req.body);

    // 🆕 SEND WEBHOOK TO INTEGRATION HUB
    try {
      await axios.post(`${INTEGRATION_HUB}/api/customer/sync`, {
        source: "sd_distribution",
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email || null,
          phone: customer.phone || null,
          customer_code: customer.customerCode,
          gst_number: customer.gstNumber || null,
          address: customer.address || null,
        },
      });
      console.log(`✅ Customer "${customer.name}" synced to integration hub`);
    } catch (webhookError) {
      console.error("Customer webhook failed:", webhookError.message);
      // Don't fail the request - customer still created in SD Distribution
    }

    res.status(201).json(customer);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          customerCode: "Customer Code already exists",
        },
      });
    }
    throw err;
  }
});

// PUT /api/customers/:id
exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await db.Customer.findByPk(req.params.id);

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  try {
    req.body.customerCode = (req.body.customerCode || "").trim().toUpperCase();
    req.body.name = (req.body.name || "").trim();
    req.body.city = (req.body.city || "").trim();
    req.body.country = (req.body.country || "").trim().toUpperCase();
    req.body.creditGroup = (req.body.creditGroup || "").trim();

    const errors = validateCustomer(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    await customer.update(req.body);

    res.json(customer);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          customerCode: "Customer Code already exists",
        },
      });
    }
    throw err;
  }
});

// DELETE /api/customers/:id  (soft delete)
exports.softDeleteCustomer = asyncHandler(async (req, res) => {
  const customer = await db.Customer.findByPk(req.params.id);
  if (!customer) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }
  await customer.update({ isDeleted: true });
  res.json({ message: "Customer moved to recycle bin" });
});

// PUT /api/customers/:id/restore
exports.restoreCustomer = asyncHandler(async (req, res) => {
  const customer = await db.Customer.findByPk(req.params.id);
  if (!customer) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }
  await customer.update({ isDeleted: false });
  res.json(customer);
});
