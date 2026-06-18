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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+\-\s()]+$/;
  const gstRegex = /^[0-9A-Z]{15}$/;

  const requiredFields = [
    "customerCode",
    "name",
    "city",
    "country",
    "riskCategory",
    "accountGroup"
  ];

  // 1. Required fields check
  requiredFields.forEach((field) => {
    if (!data[field] || !data[field].toString().trim()) {
      errors[field] = `${field} is required`;
    }
  });

  // Account Group validation - max 4 characters
  if (data.accountGroup && data.accountGroup.length > 4) {
    errors.accountGroup = "Account Group cannot exceed 4 characters";
  }

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

  // 3. Credit Group validation
  if (data.creditGroup) {
    if (!creditGroupRegex.test(data.creditGroup)) {
      errors.creditGroup =
        "Credit Group must contain only letters, numbers and spaces";
    }
  }

  // 4. Name rules
  if (data.name) {
    if (!nameRegex.test(data.name)) {
      errors.name = "Name must contain only letters and spaces";
    }
    if (data.name.length > 150) {
      errors.name = "Name cannot exceed 150 characters";
    }
  }

  // 5. City rules
  if (data.city && !cityRegex.test(data.city)) {
    errors.city = "City must contain only letters";
  }

  // 6. Country rules
  if (data.country) {
    if (!countryRegex.test(data.country)) {
      errors.country = "Country must contain only letters";
    }
    if (data.country.length > 3) {
      errors.country = "Country must be max 3 characters (e.g., IN, IND)";
    }
  }

  // 7. Email validation (optional but validate if provided)
  if (data.email && data.email.trim() !== '') {
    if (!emailRegex.test(data.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (data.email.length > 100) {
      errors.email = "Email cannot exceed 100 characters";
    }
  }

  // 8. Phone validation (optional but validate if provided)
  if (data.phone && data.phone.trim() !== '') {
    if (!phoneRegex.test(data.phone)) {
      errors.phone = "Phone number contains invalid characters";
    }
    if (data.phone.length > 20) {
      errors.phone = "Phone number cannot exceed 20 characters";
    }
  }

  // 9. GST Number validation (optional but validate if provided)
  if (data.gstNumber && data.gstNumber.trim() !== '') {
    const cleanGST = data.gstNumber.trim().toUpperCase();
    if (!gstRegex.test(cleanGST)) {
      errors.gstNumber = "GST Number must be 15 characters alphanumeric (e.g., 22AAAAA0000A1Z5)";
    }
  }

  // 10. Address validation (optional, max length check)
  if (data.address && data.address.length > 500) {
    errors.address = "Address cannot exceed 500 characters";
  }

  return errors;
};

// GET /api/customers
exports.getCustomers = asyncHandler(async (req, res) => {
  const list = await db.Customer.findAll({
    where: { isDeleted: false },
    order: [["id", "ASC"]]
  });
  res.json(list);
});

// GET /api/customers/deleted
exports.getDeletedCustomers = asyncHandler(async (req, res) => {
  const list = await db.Customer.findAll({
    where: { isDeleted: true },
    order: [["id", "ASC"]]
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
    console.log('=== CREATE CUSTOMER ===');
    console.log('Raw incoming data:', req.body);

    const customerData = {
      customerCode: (req.body.customerCode || "").trim().toUpperCase(),
      name: (req.body.name || "").trim(),
      accountGroup: (req.body.accountGroup || "").trim().toUpperCase(),
      city: (req.body.city || "").trim(),
      country: (req.body.country || "").trim().toUpperCase(),
      creditGroup: (req.body.creditGroup || "").trim() || null,
      riskCategory: req.body.riskCategory || null,
      email: (req.body.email || "").trim() || null,
      phone: (req.body.phone || "").trim() || null,
      address: (req.body.address || "").trim() || null,
      gstNumber: (req.body.gstNumber || "").trim().toUpperCase() || null,
    };

    console.log('Cleaned customer data:', customerData);

    const errors = validateCustomer(customerData);
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
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
    console.error('Error creating customer:', err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          customerCode: "Customer Code already exists",
        },
      });
    }
    res.status(500).json({ 
      message: "Error creating customer", 
      error: err.message 
    });
  }
});

// PUT /api/customers/:id
exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await db.Customer.findByPk(req.params.id);

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  try {
    console.log('=== UPDATE CUSTOMER ===');
    console.log('Update data:', req.body);

    const updateData = {
      customerCode: (req.body.customerCode || "").trim().toUpperCase(),
      name: (req.body.name || "").trim(),
      accountGroup: (req.body.accountGroup || "").trim().toUpperCase(),
      city: (req.body.city || "").trim(),
      country: (req.body.country || "").trim().toUpperCase(),
      creditGroup: (req.body.creditGroup || "").trim() || null,
      riskCategory: req.body.riskCategory || null,
      email: (req.body.email || "").trim() || null,
      phone: (req.body.phone || "").trim() || null,
      address: (req.body.address || "").trim() || null,
      gstNumber: (req.body.gstNumber || "").trim().toUpperCase() || null,
    };

    console.log('Cleaned update data:', updateData);

    const errors = validateCustomer(updateData);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    await customer.update(updateData);

    const updatedCustomer = await db.Customer.findByPk(customer.id);
    console.log('Updated customer:', updatedCustomer.toJSON());
    res.json(updatedCustomer);
  } catch (err) {
    console.error('Error updating customer:', err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        errors: {
          customerCode: "Customer Code already exists",
        },
      });
    }
    res.status(500).json({ 
      message: "Error updating customer", 
      error: err.message 
    });
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