import { Vendor } from "../models/Vendor.js";
import axios from "axios"; // ← ADD THIS

const INTEGRATION_HUB = "http://localhost:3000"; // ← ADD THIS

export const getVendors = async (req, res, next) => {
  try {
    const [rows] = await Vendor.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const createVendor = async (req, res, next) => {
  try {
    // 1. Create vendor (existing code)
    const [result] = await Vendor.create(req.body);

    // 2. Get the created vendor details
    const [rows] = await Vendor.findById(result.insertId);
    const created = rows[0] || null;

    // 3. Send to Integration Hub
    if (created) {
      try {
        await axios.post(`${INTEGRATION_HUB}/api/vendor/sync`, {
          source: "mm_creation",
          vendor: {
            id: result.insertId,
            name: created.name,
            type: created.type || "VENDOR", // 'VENDOR' or 'FARMER'
            address: created.address,
            contact: created.contact,
            gst_no: created.gst_no,
            bank_details: created.bank_details,
            rating: created.rating || 0,
          },
        });
        console.log(
          `✅ ${created.type || "VENDOR"} "${created.name}" synced to integration hub`,
        );
      } catch (syncError) {
        console.error("Sync failed:", syncError.message);
        // Don't fail the request - vendor still created in MM Creation
      }
    }

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
};

export const updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Vendor.update(id, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const deleteVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Vendor.remove(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
