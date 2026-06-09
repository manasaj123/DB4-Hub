import React, { useState } from "react";

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px"
};

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb"
};

const tdStyle = {
  padding: "6px 8px",
  borderBottom: "1px solid #f3f4f6"
};

const badgeStyle = (type) => ({
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: "999px",
  fontSize: "11px",
  backgroundColor: type === "FARMER" ? "#f97316" : "#10b981",
  color: "#ffffff"
});

const editButtonStyle = {
  padding: "4px 8px",
  fontSize: "11px",
  borderRadius: "4px",
  border: "none",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  cursor: "pointer"
};

const viewButtonStyle = {
  padding: "4px 8px",
  fontSize: "11px",
  borderRadius: "4px",
  border: "none",
  backgroundColor: "#374151",
  color: "#ffffff",
  cursor: "pointer",
  marginRight: "5px"
};

const statusBadgeStyle = (status) => ({
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: "999px",
  fontSize: "11px",
  backgroundColor: status === "ACTIVE" ? "#10b981" : "#ef4444",
  color: "#ffffff"
});

export default function VendorList({ data, onEdit }) {
  const [viewVendor, setViewVendor] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        No vendors found.
      </div>
    );
  }

  return (
    <>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Contact</th>
            <th style={thStyle}>GST</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Rating</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.map((v) => (
            <tr key={v.id}>
              <td style={tdStyle}>{v.name}</td>

              <td style={tdStyle}>
                <span style={badgeStyle(v.type)}>
                  {v.type}
                </span>
              </td>

              <td style={tdStyle}>{v.contact}</td>

              <td style={tdStyle}>{v.gst_no}</td>

              <td style={tdStyle}>
                <span style={statusBadgeStyle(v.status)}>
                  {v.status}
                </span>
              </td>

              <td style={tdStyle}>{v.rating}★</td>

              <td style={tdStyle}>
                <button
                  style={viewButtonStyle}
                  onClick={() => setViewVendor(v)}
                >
                  View
                </button>

                <button
                  style={editButtonStyle}
                  onClick={() => onEdit(v)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {viewVendor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "8px",
              minWidth: "500px",
              maxWidth: "700px"
            }}
          >
            <h3>Vendor Details</h3>

            <p><b>Name:</b> {viewVendor.name}</p>
            <p><b>Type:</b> {viewVendor.type}</p>
            <p><b>Contact:</b> {viewVendor.contact}</p>
            <p><b>GST No:</b> {viewVendor.gst_no}</p>
            <p><b>Address:</b> {viewVendor.address}</p>
            <p><b>Bank Details:</b> {viewVendor.bank_details}</p>
            <p><b>Status:</b> {viewVendor.status}</p>
            <p><b>Rating:</b> {viewVendor.rating}</p>

            <button
              onClick={() => setViewVendor(null)}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}