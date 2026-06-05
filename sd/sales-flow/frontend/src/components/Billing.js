import React, { useEffect, useState } from "react";
import { getOrdersApi } from "../api/orderApi";
import {
  createInvoiceApi,
  getInvoicesApi,
  payInvoiceApi
} from "../api/invoiceApi";

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "16px 18px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    marginTop: "10px"
  },
  title: {
    margin: "0 0 8px 0",
    color: "#0b3c5d"
  },
  subTitle: {
    margin: "12px 0 6px 0",
    color: "#333"
  },
  orderList: {
    listStyle: "none",
    paddingLeft: 0,
    margin: 0
  },
  orderItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    flexWrap: "wrap",
    gap: "8px"
  },
  orderText: {
    marginRight: "8px",
    flex: "1"
  },
  createButton: {
    padding: "4px 10px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#28a745",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    whiteSpace: "nowrap"
  },
  createButtonDisabled: {
    padding: "4px 10px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#ccc",
    color: "#666",
    cursor: "not-allowed",
    fontSize: "13px",
    whiteSpace: "nowrap"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "6px",
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
  payButton: {
    marginLeft: "8px",
    padding: "3px 8px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#28a745",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px"
  },
  paidText: {
    color: "#155724",
    fontSize: "12px",
    fontWeight: "bold"
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
  loadingText: {
    textAlign: "center",
    padding: "10px",
    color: "#666"
  },
  noOrders: {
    textAlign: "center",
    padding: "10px",
    color: "#999",
    fontStyle: "italic"
  },
  noInvoices: {
    textAlign: "center",
    padding: "10px",
    color: "#999",
    fontStyle: "italic"
  },
  statusBadge: (status) => ({
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "inline-block",
    textTransform: "uppercase",
    minWidth: "70px",
    textAlign: "center",
    backgroundColor: 
      status === "PAID" ? "#d4edda" :
      status === "PENDING" ? "#fff3cd" :
      status === "CANCELLED" ? "#f8d7da" : "#e2e3e5",
    color:
      status === "PAID" ? "#155724" :
      status === "PENDING" ? "#856404" :
      status === "CANCELLED" ? "#721c24" : "#383d41"
  }),
  amountText: {
    fontWeight: "bold",
    color: "#0b3c5d"
  },
  infoBox: {
    backgroundColor: "#f0f7ff",
    padding: "10px 12px",
    borderRadius: "4px",
    marginBottom: "12px",
    fontSize: "13px",
    color: "#004085",
    border: "1px solid #cce5ff"
  }
};

const Billing = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creatingInvoiceFor, setCreatingInvoiceFor] = useState(null);

  const load = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [o, i] = await Promise.all([
        getOrdersApi(token),
        getInvoicesApi(token)
      ]);
      setOrders(Array.isArray(o) ? o : []);
      setInvoices(Array.isArray(i) ? i : []);
      setError("");
    } catch (err) {
      setError("Failed to load data");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  // Get product name from order
  const getProductName = (order) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map(item => item.product).filter(Boolean).join(", ") || "";
    }
    if (typeof order.items === 'string') {
      try {
        const parsed = JSON.parse(order.items);
        return parsed.map(item => item.product).filter(Boolean).join(", ") || "";
      } catch (e) {
        return "";
      }
    }
    return order.product || "";
  };

  // Get quantity from order
  const getOrderQuantity = (order) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items[0].quantity || order.quantity || 1;
    }
    return order.quantity || 1;
  };

  // Calculate order total
  const getOrderTotal = (order) => {
    if (order.total && Number(order.total) > 0) {
      return Number(order.total);
    }
    if (order.items && Array.isArray(order.items)) {
      return order.items.reduce((sum, item) => {
        return sum + (Number(item.total) || Number(item.quantity) * Number(item.price) || 0);
      }, 0);
    }
    return Number(order.price || 0) * Number(order.quantity || 1);
  };

  // CHANGED: Show ALL orders that don't have invoices yet (any status)
  const ordersReadyForInvoice = orders.filter((o) => {
    const orderId = String(o.id || o._id);
    
    // Check if this order already has an invoice
    const alreadyHasInvoice = invoices.some(inv => 
      String(inv.orderId) === orderId
    );
    
    // Show all orders that don't have invoices yet (removed DELIVERED check)
    return !alreadyHasInvoice;
  });

  const handleCreateInvoice = async (order) => {
    setError("");
    setSuccess("");
    
    const orderId = order.id || order._id;
    
    // Check if invoice already exists
    const alreadyHasInvoice = invoices.some(inv => String(inv.orderId) === String(orderId));
    if (alreadyHasInvoice) {
      setError(`Invoice already exists for Order #${orderId}.`);
      return;
    }
    
    setCreatingInvoiceFor(orderId);
    
    try {
      const payload = {
        orderId: orderId,
        customerName: order.customerName || "",
        amount: getOrderTotal(order),
        items: order.items || [],
        status: "PENDING"
      };
      
      console.log("Creating invoice with data:", payload);
      
      await createInvoiceApi(token, payload);
      setSuccess(`Invoice created for Order #${orderId}`);
      setCreatingInvoiceFor(null);
      await load();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create invoice");
      console.error("Create invoice error:", err);
      setCreatingInvoiceFor(null);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    setError("");
    setSuccess("");
    
    setLoading(true);
    try {
      await payInvoiceApi(token, invoiceId);
      setSuccess(`Invoice #${invoiceId} marked as paid`);
      await load();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to pay invoice");
      console.error("Pay invoice error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
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

  // Get invoice stats
  const getInvoiceStats = () => {
    const total = invoices.length;
    const paid = invoices.filter(inv => inv.status === "PAID").length;
    const pending = invoices.filter(inv => inv.status === "PENDING").length;
    
    return { total, paid, pending };
  };

  const stats = getInvoiceStats();

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Billing & Invoices</h3>
      
      {error && <div style={styles.error}>❌ {error}</div>}
      {success && <div style={styles.success}>✅ {success}</div>}

      {/* Invoice Summary */}
      {invoices.length > 0 && (
        <div style={styles.infoBox}>
          <strong>Summary:</strong> {stats.total} Total | {stats.paid} Paid | {stats.pending} Pending
        </div>
      )}

      {/* Orders Ready for Invoicing - Shows ALL orders without invoices */}
      <h4 style={styles.subTitle}>Orders Without Invoice</h4>
      {loading && !orders.length ? (
        <div style={styles.loadingText}>Loading orders...</div>
      ) : ordersReadyForInvoice.length === 0 ? (
        <div style={styles.noOrders}>
          All orders have been invoiced.
        </div>
      ) : (
        <ul style={styles.orderList}>
          {ordersReadyForInvoice.map((o) => {
            const orderTotal = getOrderTotal(o);
            const productName = getProductName(o);
            const quantity = getOrderQuantity(o);
            const isCreating = creatingInvoiceFor === (o.id || o._id);
            
            return (
              <li key={o.id || o._id} style={styles.orderItem}>
                <span style={styles.orderText}>
                  <strong>#{o.id || o._id}</strong> - {o.customerName || "Unknown"} 
                  {" | "}{productName || "No product"}
                  {" | "}Qty: {quantity}
                  {" | "}<span style={styles.amountText}>{formatCurrency(orderTotal)}</span>
                  {" | "}<span style={styles.statusBadge(o.status)}>{o.status}</span>
                </span>
                <button
                  style={isCreating ? styles.createButtonDisabled : styles.createButton}
                  onClick={() => handleCreateInvoice(o)}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Invoice"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Invoices List */}
      <h4 style={styles.subTitle}>Invoices ({invoices.length})</h4>
      {loading && !invoices.length ? (
        <div style={styles.loadingText}>Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div style={styles.noInvoices}>No invoices yet. Create an invoice from orders above.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Invoice #</th>
                <th style={styles.th}>Order #</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const invoiceId = inv.id || inv._id;
                const isPending = inv.status === "PENDING";
                
                return (
                  <tr key={invoiceId}>
                    <td style={styles.td}>
                      <strong>{inv.invoiceNumber || `INV-${String(invoiceId).padStart(4, '0')}`}</strong>
                    </td>
                    <td style={styles.td}>#{inv.orderId}</td>
                    <td style={styles.td}>{inv.customerName || inv.Order?.customerName || "-"}</td>
                    <td style={styles.td}>
                      <span style={styles.amountText}>{formatCurrency(inv.amount || 0)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge(inv.status)}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(inv.createdAt)}</td>
                    <td style={styles.td}>
                      {isPending ? (
                        <button
                          style={styles.payButton}
                          onClick={() => handlePayInvoice(invoiceId)}
                          disabled={loading}
                        >
                          ✓ Mark Paid
                        </button>
                      ) : (
                        <span style={styles.paidText}>✅ Paid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Billing;