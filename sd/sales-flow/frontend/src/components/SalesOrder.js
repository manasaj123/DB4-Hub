import React, { useEffect, useState } from "react";
import { getOrdersApi, createOrderApi, updateOrderApi, deleteOrderApi } from "../api/orderApi";

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "16px 18px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    marginTop: "10px"
  },
  title: {
    margin: "0 0 10px 0",
    color: "#0b3c5d",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  formRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },
  input: {
    flex: "1 1 150px",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  inputError: {
    flex: "1 1 150px",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid red",
    fontSize: "14px",
    boxSizing: "border-box",
    backgroundColor: "#fff8f8"
  },
  button: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#1976d2",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px"
  },
  cancelButton: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#6c757d",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    marginLeft: "4px"
  },
  editButton: {
    padding: "4px 10px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#fcebb8",
    color: "#000",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "4px",
    fontWeight: "bold"
  },
  viewButton: {
    padding: "4px 10px",
    borderRadius: "4px",
    border: "1px solid #0b3c5d",
    backgroundColor: "#fff",
    color: "#0b3c5d",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "4px"
  },
  deleteButton: {
    padding: "4px 10px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#ffaab3",
    color: "#0e0d0d",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "8px",
    fontSize: "14px"
  },
  th: {
    borderBottom: "1px solid #ccc",
    textAlign: "left",
    padding: "6px",
    backgroundColor: "#f7f7f7"
  },
  td: {
    borderBottom: "1px solid #eee",
    padding: "6px"
  },
  error: {
    color: "red",
    marginBottom: "8px",
    fontSize: "13px",
    padding: "8px",
    backgroundColor: "#fff8f8",
    borderRadius: "4px"
  },
  success: {
    color: "green",
    marginBottom: "8px",
    fontSize: "13px",
    padding: "8px",
    backgroundColor: "#f0fff0",
    borderRadius: "4px"
  },
  warning: {
    color: "#856404",
    marginBottom: "8px",
    fontSize: "13px",
    padding: "8px",
    backgroundColor: "#fff3cd",
    borderRadius: "4px",
    border: "1px solid #ffc107"
  },
  loadingText: {
    textAlign: "center",
    padding: "10px",
    color: "#666"
  },
  noOrders: {
    textAlign: "center",
    padding: "20px",
    color: "#999",
    fontStyle: "italic"
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "inline-block",
    textTransform: "uppercase",
    minWidth: "70px",
    textAlign: "center"
  },
  fieldError: {
    color: "red",
    fontSize: "11px",
    marginTop: "-6px",
    marginBottom: "6px"
  },
  roleBadge: {
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold"
  },
  infoBox: {
    padding: "8px 12px",
    backgroundColor: "#f0f7ff",
    borderRadius: "4px",
    marginBottom: "12px",
    fontSize: "13px",
    color: "#004085",
    border: "1px solid #cce5ff"
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "80vh",
    overflow: "auto"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px"
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666"
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f0f0f0"
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#666",
    minWidth: "120px"
  },
  detailValue: {
    color: "#333",
    textAlign: "right"
  },
  confirmButton: {
    padding: "8px 20px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#dc3545",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    marginRight: "10px"
  },
  cancelConfirmButton: {
    padding: "8px 20px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    color: "#333",
    cursor: "pointer",
    fontSize: "14px"
  },
  actionsCell: {
    whiteSpace: "nowrap",
    minWidth: "180px"
  }
};

const SalesOrder = ({ token, userRole }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    customerRegion: "",
    product: "",
    quantity: "",
    price: ""
  });

  const isAdmin = userRole === "admin";

  const loadOrders = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await getOrdersApi(token);
      setOrders(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const isCustomerNameDuplicate = (name, excludeOrderId = null) => {
    if (!name || !name.trim()) return false;
    const trimmedName = name.trim().toLowerCase();
    return orders.some(order => 
      order.customerName && 
      order.customerName.toLowerCase().trim() === trimmedName &&
      (excludeOrderId ? (order.id || order._id) !== excludeOrderId : true)
    );
  };

  const validateTextField = (value, fieldName) => {
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    
    const invalidCharsRegex = /[!@#$%^&*(),.?":{}|<>[\]\\\/`~;'_+=0-9]/;
    if (invalidCharsRegex.test(value)) {
      return `${fieldName} should not contain special characters or numbers`;
    }
    
    return "";
  };

  const handleInputChange = (field, value) => {
    if (field === "customerName") {
      value = value.replace(/[!@#$%^&*(),.?":{}|<>[\]\\\/`~;'_+=0-9]/g, '');
    }
    
    if (field === "customerRegion" || field === "product") {
      value = value.replace(/[!@#$%^&*(),.?":{}|<>[\]\\\/`~;'_+=0-9]/g, '');
    }
    
    setForm({ ...form, [field]: value });
    
    if (fieldErrors[field]) {
      const newFieldErrors = { ...fieldErrors };
      delete newFieldErrors[field];
      setFieldErrors(newFieldErrors);
    }
    
    if (error) setError("");
  };

  // Viewer clicks Edit - Show warning
  const handleEdit = (order) => {
    if (!isAdmin) {
      setWarning("⚠️ Access Denied: You are logged in as Viewer. Only users with Admin role can edit orders. Please contact your administrator for access.");
      setTimeout(() => setWarning(""), 5000);
      return;
    }
    
    const orderId = order.id || order._id;
    setEditingOrderId(orderId);
    
    setForm({
      customerName: order.customerName || "",
      customerRegion: order.customerRegion || "",
      product: order.items?.[0]?.product || order.product || "",
      quantity: order.items?.[0]?.quantity || order.quantity || "",
      price: order.items?.[0]?.price || order.price || ""
    });
    
    setFieldErrors({});
    setError("");
    setSuccess("");
    setWarning("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setForm({
      customerName: "",
      customerRegion: "",
      product: "",
      quantity: "",
      price: ""
    });
    setFieldErrors({});
    setError("");
  };

  const handleView = (order) => {
    setViewingOrder(order);
  };

  // Viewer clicks Delete - Show warning
  const handleDeleteClick = (order) => {
    if (!isAdmin) {
      setWarning("⚠️ Access Denied: You are logged in as Viewer. Only users with Admin role can delete orders. Please contact your administrator for access.");
      setTimeout(() => setWarning(""), 5000);
      return;
    }
    setDeletingOrder(order);
  };

  const confirmDelete = async () => {
    if (!deletingOrder) return;
    
    setLoading(true);
    try {
      const orderId = deletingOrder.id || deletingOrder._id;
      await deleteOrderApi(token, orderId);
      setSuccess(`✅ Order #${orderId} deleted successfully!`);
      setDeletingOrder(null);
      loadOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete order");
      setDeletingOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setWarning("⚠️ Access Denied: You are logged in as Viewer. Only users with Admin role can create orders.");
      setTimeout(() => setWarning(""), 5000);
      return;
    }
    
    setError("");
    setSuccess("");
    
    const newFieldErrors = {};

    const customerNameError = validateTextField(form.customerName, "Customer name");
    if (customerNameError) {
      newFieldErrors.customerName = customerNameError;
    } else if (isCustomerNameDuplicate(form.customerName, editingOrderId)) {
      newFieldErrors.customerName = "This customer name already exists. Please use a different name.";
    }

    const regionError = validateTextField(form.customerRegion, "Region");
    if (regionError) newFieldErrors.customerRegion = regionError;

    const productError = validateTextField(form.product, "Product name");
    if (productError) newFieldErrors.product = productError;

    if (!form.quantity || Number(form.quantity) < 1) {
      newFieldErrors.quantity = "Quantity must be at least 1";
    }

    if (form.price === "" || Number(form.price) < 0) {
      newFieldErrors.price = "Please enter a valid price";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    const payload = {
      customerName: form.customerName.trim(),
      customerRegion: form.customerRegion.trim(),
      product: form.product.trim(),
      quantity: Number(form.quantity),
      price: Number(form.price)
    };

    try {
      if (editingOrderId) {
        await updateOrderApi(token, editingOrderId, payload);
        setSuccess("✅ Order updated successfully!");
        setEditingOrderId(null);
      } else {
        await createOrderApi(token, payload);
        setSuccess("✅ Order created successfully!");
      }
      
      setForm({
        customerName: "",
        customerRegion: "",
        product: "",
        quantity: "",
        price: ""
      });
      setFieldErrors({});
      loadOrders();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || `Failed to ${editingOrderId ? 'update' : 'create'} order`);
    }
  };

  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    const statusStyles = {
      pending: { backgroundColor: "#fff3cd", color: "#856404" },
      created: { backgroundColor: "#cce5ff", color: "#004085" },
      invoiced: { backgroundColor: "#d4edda", color: "#155724" },
      delivered: { backgroundColor: "#d4edda", color: "#155724" },
      processing: { backgroundColor: "#fff3cd", color: "#856404" },
      completed: { backgroundColor: "#d4edda", color: "#155724" },
      cancelled: { backgroundColor: "#f8d7da", color: "#721c24" }
    };
    return statusStyles[statusLower] || statusStyles.pending;
  };

  const getProductName = (order) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map(item => item.product).filter(Boolean).join(", ") || "";
    }
    return order.product || "";
  };

  const getOrderQuantity = (order) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items[0].quantity || order.quantity || 1;
    }
    return order.quantity || 1;
  };

  const getOrderTotal = (order) => {
    if (order.total && Number(order.total) > 0) {
      return Number(order.total);
    }
    if (order.items && Array.isArray(order.items)) {
      return order.items.reduce((sum, item) => {
        return sum + (Number(item.total) || Number(item.quantity) * Number(item.price) || 0);
      }, 0);
    }
    return Number(order.quantity) * Number(order.price) || 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>
        {editingOrderId ? '✏️ Edit Sales Order' : '📋 Sales Orders'}
        <span style={{
          ...styles.roleBadge,
          backgroundColor: isAdmin ? "#d4edda" : "#cce5ff",
          color: isAdmin ? "#155724" : "#004085"
        }}>
          {isAdmin ? "🔧 Admin" : "👁️ Viewer"}
        </span>
      </h3>
      
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}
      {warning && <div style={styles.warning}>{warning}</div>}
      
      {/* Admin: Show Create/Edit Form */}
      {isAdmin && (
        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <div style={{ flex: "1 1 150px" }}>
              <input
                style={fieldErrors.customerName ? styles.inputError : styles.input}
                placeholder="Customer Name *"
                value={form.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                required
              />
              {fieldErrors.customerName && (
                <div style={styles.fieldError}>{fieldErrors.customerName}</div>
              )}
            </div>
            
            <div style={{ flex: "1 1 150px" }}>
              <input
                style={fieldErrors.customerRegion ? styles.inputError : styles.input}
                placeholder="Region *"
                value={form.customerRegion}
                onChange={(e) => handleInputChange("customerRegion", e.target.value)}
                required
              />
              {fieldErrors.customerRegion && (
                <div style={styles.fieldError}>{fieldErrors.customerRegion}</div>
              )}
            </div>
            
            <div style={{ flex: "1 1 150px" }}>
              <input
                style={fieldErrors.product ? styles.inputError : styles.input}
                placeholder="Product *"
                value={form.product}
                onChange={(e) => handleInputChange("product", e.target.value)}
                required
              />
              {fieldErrors.product && (
                <div style={styles.fieldError}>{fieldErrors.product}</div>
              )}
            </div>
            
            <div style={{ flex: "1 1 100px" }}>
              <input
                style={fieldErrors.quantity ? styles.inputError : styles.input}
                type="number"
                placeholder="Qty *"
                value={form.quantity}
                min="1"
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                required
              />
              {fieldErrors.quantity && (
                <div style={styles.fieldError}>{fieldErrors.quantity}</div>
              )}
            </div>
            
            <div style={{ flex: "1 1 120px" }}>
              <input
                style={fieldErrors.price ? styles.inputError : styles.input}
                type="number"
                placeholder="Price (₹) *"
                value={form.price}
                min="0"
                step="0.01"
                onChange={(e) => handleInputChange("price", e.target.value)}
                required
              />
              {fieldErrors.price && (
                <div style={styles.fieldError}>{fieldErrors.price}</div>
              )}
            </div>
            
            <button style={styles.button} type="submit">
              {editingOrderId ? '✅ Update Order' : '➕ Create Order'}
            </button>
            
            {editingOrderId && (
              <button 
                style={styles.cancelButton} 
                type="button"
                onClick={handleCancelEdit}
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      )}
      
      {/* Viewer: Show info message */}
      {!isAdmin && (
        <div style={styles.infoBox}>
          👁️ <strong>View Only Mode:</strong> You can view order details, but creating, editing, and deleting orders requires Admin access.
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div style={styles.loadingText}>⏳ Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={styles.noOrders}>
          {isAdmin ? "No orders yet. Create your first order above." : "No orders found."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order </th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Region</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
  {orders.map((o, index) => (
    <tr key={o.id || o._id}>
      <td style={styles.td}><strong>{index + 1}</strong></td>
                  <td style={styles.td}>{o.customerName || "-"}</td>
                  <td style={styles.td}>{o.customerRegion || "-"}</td>
                  <td style={styles.td}>{getProductName(o) || "-"}</td>
                  <td style={styles.td}>{getOrderQuantity(o)}</td>
                  <td style={styles.td}><strong>{formatCurrency(getOrderTotal(o))}</strong></td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(o.status)
                    }}>
                      {o.status?.toUpperCase() || "PENDING"}
                    </span>
                  </td>
                  <td style={styles.td}>{formatDate(o.createdAt)}</td>
                  <td style={{ ...styles.td, ...styles.actionsCell }}>
                    <button 
                      style={styles.viewButton}
                      onClick={() => handleView(o)}
                      title="View order details"
                    >
                      👁️ View
                    </button>
                    
                    <button 
                      style={styles.editButton}
                      onClick={() => handleEdit(o)}
                      title={isAdmin ? "Edit order" : "Only Admin can edit"}
                    >
                      ✏️ Edit
                    </button>
                    
                    <button 
                      style={styles.deleteButton}
                      onClick={() => handleDeleteClick(o)}
                      title={isAdmin ? "Delete order" : "Only Admin can delete"}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Order Modal */}
      {viewingOrder && (
        <div style={styles.modal} onClick={() => setViewingOrder(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📋 Order #{viewingOrder.id || viewingOrder._id}</h3>
              <button style={styles.closeButton} onClick={() => setViewingOrder(null)}>×</button>
            </div>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Customer Name</span>
              <span style={styles.detailValue}><strong>{viewingOrder.customerName || "-"}</strong></span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Region</span>
              <span style={styles.detailValue}>{viewingOrder.customerRegion || "-"}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Product</span>
              <span style={styles.detailValue}>{getProductName(viewingOrder) || "-"}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Quantity</span>
              <span style={styles.detailValue}>{getOrderQuantity(viewingOrder)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Price per Unit</span>
              <span style={styles.detailValue}>
                {formatCurrency(viewingOrder.items?.[0]?.price || viewingOrder.price || 0)}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Total Amount</span>
              <span style={{ ...styles.detailValue, fontWeight: "bold", color: "#0b3c5d", fontSize: "16px" }}>
                {formatCurrency(getOrderTotal(viewingOrder))}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Status</span>
              <span style={styles.detailValue}>
                <span style={{ ...styles.statusBadge, ...getStatusStyle(viewingOrder.status) }}>
                  {viewingOrder.status?.toUpperCase() || "PENDING"}
                </span>
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Created Date</span>
              <span style={styles.detailValue}>{formatDate(viewingOrder.createdAt)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Last Updated</span>
              <span style={styles.detailValue}>{formatDate(viewingOrder.updatedAt)}</span>
            </div>
            
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button 
                style={styles.cancelConfirmButton} 
                onClick={() => setViewingOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, textAlign: "center", maxWidth: "400px" }}>
            <h3>⚠️ Confirm Delete</h3>
            <p>Are you sure you want to delete this order?</p>
            <div style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "4px", margin: "10px 0" }}>
              <p><strong>Order #:</strong> {deletingOrder.id || deletingOrder._id}</p>
              <p><strong>Customer:</strong> {deletingOrder.customerName}</p>
              <p><strong>Amount:</strong> {formatCurrency(getOrderTotal(deletingOrder))}</p>
            </div>
            <p style={{ color: "#dc3545", fontSize: "13px", fontWeight: "bold" }}>
              ⚠️ This action cannot be undone!
            </p>
            
            <div style={{ marginTop: "20px" }}>
              <button 
                style={styles.confirmButton}
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? "⏳ Deleting..." : "🗑️ Yes, Delete"}
              </button>
              <button 
                style={styles.cancelConfirmButton}
                onClick={() => setDeletingOrder(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrder;