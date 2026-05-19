import { useState, useEffect } from "react";
import axios from "axios";

export default function CustomerOnboarding() {
  const [customers, setCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const res = await axios.get("http://localhost:5001/api/customers");
    setCustomers(res.data);
  };

  const validateField = (field, value) => {
    let msg = "";

    if (field === "name") {
      if (!value) msg = "Name is required";
      else if (
        customers.some(
          (c) => c.name.toLowerCase() === value.toLowerCase()
        )
      ) msg = "Customer already exists";
    }

    if (field === "address") {
      if (!value) msg = "Address is required";
    }

    if (field === "contact") {
      if (!value) msg = "Contact is required";
      else if (!/^\d+$/.test(value)) msg = "Only numbers allowed";
      else if (value.length !== 10) msg = "Must be 10 digits";
    }

    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field, value) => {
    if (field === "contact" && !/^\d*$/.test(value)) return;

    if (field === "name") setCustomerName(value);
    if (field === "address") setAddress(value);
    if (field === "contact") setContact(value);

    if (touched[field]) validateField(field, value);
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const isValidField = (field) =>
    touched[field] && !errors[field] && getValue(field);

  const getValue = (field) => {
    if (field === "name") return customerName;
    if (field === "address") return address;
    if (field === "contact") return contact;
  };

  const addCustomer = async () => {
    setTouched({ name: true, address: true, contact: true });

    validateField("name", customerName);
    validateField("address", address);
    validateField("contact", contact);

    if (
      errors.name ||
      errors.address ||
      errors.contact ||
      !customerName ||
      !address ||
      !contact
    ) return;

    await axios.post("http://localhost:5001/api/customers", {
      name: customerName,
      address,
      contact,
    });

    fetchCustomers();

    setCustomerName("");
    setAddress("");
    setContact("");
    setErrors({});
    setTouched({});
  };

  const isFormValid =
    customerName &&
    address &&
    contact &&
    !errors.name &&
    !errors.address &&
    !errors.contact;

  return (
    <div style={styles.page}>
      {/* FORM CARD */}
      <div style={styles.card}>
        <h2 style={styles.title}>Customer Onboarding</h2>

        {/* NAME */}
        <div style={styles.field}>
          <input
            style={styles.input}
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={(e) => handleBlur("name", e.target.value)}
          />
          {isValidField("name") && <span style={styles.tick}>✔</span>}
          {touched.name && errors.name && (
            <div style={styles.error}>{errors.name}</div>
          )}
        </div>

        {/* ADDRESS */}
        <div style={styles.field}>
          <input
            style={styles.input}
            placeholder="Address"
            value={address}
            onChange={(e) => handleChange("address", e.target.value)}
            onBlur={(e) => handleBlur("address", e.target.value)}
          />
          {isValidField("address") && <span style={styles.tick}>✔</span>}
          {touched.address && errors.address && (
            <div style={styles.error}>{errors.address}</div>
          )}
        </div>

        {/* CONTACT */}
        <div style={styles.field}>
          <input
            style={styles.input}
            placeholder="Contact Number"
            value={contact}
            maxLength={10}
            onChange={(e) => handleChange("contact", e.target.value)}
            onBlur={(e) => handleBlur("contact", e.target.value)}
          />
          {isValidField("contact") && <span style={styles.tick}>✔</span>}
          {touched.contact && errors.contact && (
            <div style={styles.error}>{errors.contact}</div>
          )}
        </div>

        <button
          style={{
            ...styles.button,
            backgroundColor: isFormValid ? "#4CAF50" : "#ccc",
            cursor: isFormValid ? "pointer" : "not-allowed",
          }}
          onClick={addCustomer}
          disabled={!isFormValid}
        >
          Add Customer
        </button>
      </div>

      {/* LIST */}
      <div style={styles.listCard}>
        <h3>Customers</h3>
        <ul>
          {customers.map((c) => (
            <li key={c.id} style={styles.listItem}>
              <b>{c.name}</b> | {c.address} | {c.contact}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ===== FIXED STYLES ===== */
const styles = {
  page: {
    display: "flex",
    flexWrap: "wrap",
    gap: "30px",
    justifyContent: "center",
    padding: "40px",
    background: "#f4f6f8",
    minHeight: "100vh",
    fontFamily: "Arial",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
  },

  field: {
    marginBottom: "15px",
    position: "relative",
    width: "100%",
  },

  input: {
    width: "100%",
    padding: "10px",
    paddingRight: "30px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },

  error: {
    color: "red",
    fontSize: "12px",
    marginTop: "4px",
  },

  tick: {
    color: "green",
    position: "absolute",
    right: "10px",
    top: "10px",
    fontWeight: "bold",
  },

  button: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
  },

  listCard: {
    width: "100%",
    maxWidth: "320px",
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  listItem: {
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
};