import { useState, useEffect } from "react";
import axios from "axios";

export default function CustomerOnboarding() {
  const [customers, setCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [email, setEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/customers");
      setCustomers(res.data);
      
      // Generate next code
      const nextCode = generateNextCode(res.data);
      setCustomerCode(nextCode);
    } catch (err) {
      console.error("Fetch error:", err);
      setCustomers([]);
      setCustomerCode('CUST-00001');
    }
  };

  const generateNextCode = (existingCustomers) => {
    if (!existingCustomers || existingCustomers.length === 0) {
      return 'CUST-00001';
    }
    
    let maxNumber = 0;
    existingCustomers.forEach(customer => {
      if (customer.customer_code) {
        const match = customer.customer_code.match(/CUST-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) maxNumber = num;
        }
      }
    });
    
    return `CUST-${String(maxNumber + 1).padStart(5, '0')}`;
  };

  const validateField = (field, value) => {
    let msg = "";

    if (field === "name") {
      if (!value || !value.trim()) {
        msg = "Customer name is required";
      } else if (value.trim().length < 2) {
        msg = "Name must be at least 2 characters";
      } else if (value.trim().length > 50) {
        msg = "Name must be less than 50 characters";
      } else if (!/^[A-Za-z]/.test(value.trim())) {
        msg = "Name must start with a letter";
      } else if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(value.trim())) {
        msg = "Name can only contain letters, spaces, hyphens, and apostrophes";
      } else if (/\s{2,}/.test(value)) {
        msg = "Name cannot have multiple consecutive spaces";
      }
    }

    if (field === "email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        msg = "Please enter a valid email address";
      }
    }

    if (field === "gstNumber") {
      if (value && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ[A-Z\d]$/.test(value)) {
        msg = "Please enter a valid GST number (e.g., 29ABCDE1234F1Z5)";
      }
    }

    if (field === "address") {
      if (!value || !value.trim()) {
        msg = "Address is required";
      } else if (value.trim().length < 3) {
        msg = "Address must be at least 3 characters";
      } else if (value.trim().length > 200) {
        msg = "Address must be less than 200 characters";
      } else if (/[<>{}[\]\\|`~^]/.test(value)) {
        msg = "Address contains invalid characters";
      } else if (/[@#$%^&*]/.test(value)) {
        msg = "Address cannot contain @, #, $, %, ^, &, *";
      }
    }

    if (field === "contact") {
      if (!value || !value.trim()) {
        msg = "Contact is required";
      } else if (!/^\d+$/.test(value)) {
        msg = "Only numbers allowed";
      } else if (value.length !== 10) {
        msg = "Must be exactly 10 digits";
      } else if (!/^[6-9]/.test(value)) {
        msg = "Must start with 6, 7, 8, or 9";
      } else if (/^(\d)\1{9}$/.test(value)) {
        msg = "Invalid contact number (all same digits)";
      }
    }

    setErrors((prev) => ({ ...prev, [field]: msg }));
    return msg;
  };

  const handleChange = (field, value) => {
    // Block invalid characters
    if (field === "contact" && !/^\d*$/.test(value)) return;
    
    if (field === "name") {
      if (/[0-9@#$%^&*()_+=:;'"`,.?/\\|<>{}[\]~`]/.test(value)) return;
      if (value.startsWith(' ') || value.startsWith('-') || value.startsWith("'")) return;
    }
    
    if (field === "address") {
      if (/[<>{}[\]\\|`~^@#$%^&*]/.test(value)) return;
    }
    
    if (field === "gstNumber") {
      value = value.toUpperCase();
      if (value && !/^[\dA-Z]*$/.test(value)) return;
    }

    if (field === "name") setCustomerName(value);
    if (field === "email") setEmail(value);
    if (field === "gstNumber") setGstNumber(value);
    if (field === "address") setAddress(value);
    if (field === "contact") setContact(value);

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  // Simple check if form can be submitted
  const canSubmit = () => {
    return (
      customerName.trim().length >= 2 &&
      /^[A-Za-z]/.test(customerName.trim()) &&
      address.trim().length >= 3 &&
      !/[@#$%^&*]/.test(address) &&
      contact.length === 10 &&
      /^[6-9]/.test(contact) &&
      !isSubmitting
    );
  };

  const addCustomer = async () => {
    // Mark all as touched
    setTouched({ 
      name: true, 
      email: true, 
      gstNumber: true, 
      address: true, 
      contact: true 
    });

    // Validate all fields
    const nameError = validateField("name", customerName);
    const addressError = validateField("address", address);
    const contactError = validateField("contact", contact);
    validateField("email", email);
    validateField("gstNumber", gstNumber);

    // Check if required fields have errors
    if (nameError || addressError || contactError) {
      return;
    }

    // Final check
    if (!customerName.trim() || !address.trim() || !contact.trim()) {
      alert("Please fill in all required fields (Name, Address, Contact)");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post("http://localhost:5001/api/customers", {
        customerCode: customerCode,
        name: customerName.trim(),
        email: email.trim(),
        gstNumber: gstNumber.trim(),
        address: address.trim(),
        contact: contact.trim(),
        status: status
      });

      // Success
      alert(`Customer added successfully! Code: ${customerCode}`);
      
      // Reset form
      setCustomerName("");
      setEmail("");
      setGstNumber("");
      setAddress("");
      setContact("");
      setStatus("Active");
      setErrors({});
      setTouched({});
      
      // Refresh list and generate new code
      await fetchCustomers();
      
    } catch (error) {
      console.error("Error adding customer:", error);
      const errorMsg = error.response?.data?.error || "Failed to add customer";
      
      if (errorMsg.includes("already exists")) {
        // Generate new code and retry
        const newCode = generateNextCode(customers);
        setCustomerCode(newCode);
        alert(`${errorMsg}\nNew code generated: ${newCode}. Please try again.`);
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* FORM CARD */}
      <div style={styles.card}>
        <h2 style={styles.title}>👥 Customer Onboarding</h2>

        {/* Customer Code */}
        <div style={styles.field}>
          <label style={styles.label}>Customer Code (Auto-generated)</label>
          <input
            style={{
              ...styles.input,
              backgroundColor: '#f0f0f0',
              fontWeight: 'bold',
              color: '#2c3e50',
            }}
            value={customerCode}
            readOnly
          />
        </div>

        {/* NAME */}
        <div style={styles.field}>
          <label style={styles.label}>Customer Name *</label>
          <input
            style={{
              ...styles.input,
              borderColor: touched.name && errors.name ? "#ff4444" : 
                          touched.name && !errors.name && customerName ? "#4CAF50" : "#ccc"
            }}
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={(e) => handleBlur("name", e.target.value)}
          />
          {touched.name && !errors.name && customerName && <span style={styles.tick}>✔</span>}
          {touched.name && errors.name && (
            <div style={styles.error}>{errors.name}</div>
          )}
        </div>

        {/* EMAIL */}
        <div style={styles.field}>
          <label style={styles.label}>Email (Optional)</label>
          <input
            style={{
              ...styles.input,
              borderColor: touched.email && errors.email ? "#ff4444" : 
                          touched.email && !errors.email && email ? "#4CAF50" : "#ccc"
            }}
            placeholder="Enter email address"
            type="email"
            value={email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
          />
          {touched.email && !errors.email && email && <span style={styles.tick}>✔</span>}
          {touched.email && errors.email && (
            <div style={styles.error}>{errors.email}</div>
          )}
        </div>

        {/* GST Number */}
        <div style={styles.field}>
          <label style={styles.label}>GST Number (Optional)</label>
          <input
            style={{
              ...styles.input,
              borderColor: touched.gstNumber && errors.gstNumber ? "#ff4444" : 
                          touched.gstNumber && !errors.gstNumber && gstNumber ? "#4CAF50" : "#ccc"
            }}
            placeholder="Enter GST number (e.g., 29ABCDE1234F1Z5)"
            value={gstNumber}
            maxLength={15}
            onChange={(e) => handleChange("gstNumber", e.target.value)}
            onBlur={(e) => handleBlur("gstNumber", e.target.value)}
          />
          {touched.gstNumber && !errors.gstNumber && gstNumber && <span style={styles.tick}>✔</span>}
          {touched.gstNumber && errors.gstNumber && (
            <div style={styles.error}>{errors.gstNumber}</div>
          )}
        </div>

        {/* ADDRESS */}
        <div style={styles.field}>
          <label style={styles.label}>Address *</label>
          <input
            style={{
              ...styles.input,
              borderColor: touched.address && errors.address ? "#ff4444" : 
                          touched.address && !errors.address && address ? "#4CAF50" : "#ccc"
            }}
            placeholder="Enter complete address"
            value={address}
            onChange={(e) => handleChange("address", e.target.value)}
            onBlur={(e) => handleBlur("address", e.target.value)}
          />
          {touched.address && !errors.address && address && <span style={styles.tick}>✔</span>}
          {touched.address && errors.address && (
            <div style={styles.error}>{errors.address}</div>
          )}
        </div>

        {/* CONTACT */}
        <div style={styles.field}>
          <label style={styles.label}>Contact Number *</label>
          <input
            style={{
              ...styles.input,
              borderColor: touched.contact && errors.contact ? "#ff4444" : 
                          touched.contact && !errors.contact && contact.length === 10 ? "#4CAF50" : "#ccc"
            }}
            placeholder="Enter 10-digit mobile number"
            value={contact}
            maxLength={10}
            onChange={(e) => handleChange("contact", e.target.value)}
            onBlur={(e) => handleBlur("contact", e.target.value)}
          />
          {touched.contact && !errors.contact && contact.length === 10 && <span style={styles.tick}>✔</span>}
          {touched.contact && errors.contact && (
            <div style={styles.error}>{errors.contact}</div>
          )}
        </div>

        {/* STATUS */}
        <div style={styles.field}>
          <label style={styles.label}>Status</label>
          <select
            style={{
              ...styles.input,
              borderColor: "#ccc"
            }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <button
          style={{
            ...styles.button,
            backgroundColor: canSubmit() ? "#4CAF50" : "#ccc",
            cursor: canSubmit() ? "pointer" : "not-allowed",
            opacity: isSubmitting ? 0.7 : 1,
          }}
          onClick={addCustomer}
          disabled={!canSubmit()}
        >
          {isSubmitting ? "⏳ Adding..." : "✅ Add Customer"}
        </button>
      </div>

      {/* LIST */}
      <div style={styles.listCard}>
        <h3>👥 Customers ({customers.length})</h3>
        {customers.length === 0 ? (
          <p style={styles.emptyMessage}>No customers registered yet</p>
        ) : (
          <ul style={styles.list}>
            {customers.map((c) => (
              <li key={c.id} style={styles.listItem}>
                <div style={styles.customerHeader}>
                  <b style={styles.customerName}>{c.name}</b>
                  <span style={styles.code}>({c.customer_code || 'N/A'})</span>
                </div>
                {c.email && <div style={styles.detail}>📧 {c.email}</div>}
                <div style={styles.detail}>📞 {c.contact}</div>
                <div style={styles.detail}>🏠 {c.address}</div>
                <div style={styles.detail}>
                  {c.gst_number && <span>🧾 GST: {c.gst_number} | </span>}
                  <span style={{
                    color: c.status === 'Active' ? 'green' : 'red',
                    fontWeight: 'bold',
                    background: c.status === 'Active' ? '#d4edda' : '#f8d7da',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {c.status || 'Active'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  page: {
    display: "flex",
    flexWrap: "wrap",
    gap: "30px",
    justifyContent: "center",
    padding: "10px",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "500px",
    background: "#fff",
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  title: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#2c3e50",
    fontSize: "24px",
    fontWeight: "700",
  },

  label: {
    display: "block",
    marginBottom: "5px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#495057",
  },

  field: {
    marginBottom: "18px",
    position: "relative",
    width: "100%",
  },

  input: {
    width: "100%",
    padding: "12px",
    paddingRight: "35px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    transition: "border-color 0.3s, box-shadow 0.3s",
    fontSize: "14px",
    outline: "none",
  },

  error: {
    color: "#dc3545",
    fontSize: "12px",
    marginTop: "5px",
    fontWeight: "500",
  },

  tick: {
    color: "#28a745",
    position: "absolute",
    right: "12px",
    top: "38px",
    fontWeight: "bold",
    fontSize: "16px",
  },

  button: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    transition: "all 0.3s ease",
    marginTop: "10px",
  },

  listCard: {
    width: "100%",
    maxWidth: "450px",
    background: "#fff",
    padding: "25px",
    borderRadius: "15px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
    maxHeight: "1000px",
    overflowY: "auto",
    height: "900px",
  },

  list: {
    listStyle: "none",
    padding: "0",
    margin: "0",
  },

  listItem: {
    padding: "15px",
    borderBottom: "1px solid #e9ecef",
    transition: "background-color 0.3s",
    borderRadius: "8px",
    marginBottom: "8px",
  },

  customerHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "5px",
  },

  customerName: {
    fontSize: "16px",
    color: "#2c3e50",
  },

  code: {
    color: "#6c757d",
    fontSize: "12px",
    marginLeft: "10px",
    background: "#f8f9fa",
    padding: "2px 8px",
    borderRadius: "4px",
  },

  detail: {
    fontSize: "13px",
    color: "#495057",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  emptyMessage: {
    textAlign: "center",
    color: "#6c757d",
    padding: "40px 20px",
    fontSize: "16px",
  },
};