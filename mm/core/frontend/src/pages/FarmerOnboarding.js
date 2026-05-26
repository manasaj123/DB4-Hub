import { useState, useEffect } from "react";
import axios from "axios";

export default function FarmerOnboarding() {
  const [farmers, setFarmers] = useState([]);
  const [farmerName, setFarmerName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    const res = await axios.get("http://localhost:5001/api/farmers");
    setFarmers(res.data);
  };

  const validateField = (field, value) => {
    let msg = "";

    if (field === "name") {
      if (!value) {
        msg = "Farmer name is required";
      } else if (value.length < 6) {
        msg = "Name must be at least 6 characters";
      } else if (value.length > 50) {
        msg = "Name must be less than 50 characters";
      } else if (/^[^a-zA-Z]+$/.test(value)) {
        msg = "Name must contain letters";
      } else if (/[<>{}[\]\\|`~^]/.test(value)) {
        msg = "Name contains invalid characters";
      } else if (/^[a-zA-Z]{1,2}[!@#$%&*()_+=:;'",.?/\\-]/.test(value)) {
        msg = "Name must start with a proper name";
      } else if (/([!@#$%&*()_+=:;'",.?/\\-]){3,}/.test(value)) {
        msg = "Too many consecutive special characters";
      } else if (value.replace(/[a-zA-Z]/g, '').length > value.length * 0.5) {
        msg = "Name must contain mostly letters";
      } else if (
        farmers.some(
          (f) => f.name.toLowerCase() === value.toLowerCase()
        )
      ) {
        msg = "Farmer already exists";
      }
    }

    if (field === "address") {
      if (!value) {
        msg = "Address is required";
      } else if (value.length < 5) {
        msg = "Address must be at least 5 characters";
      } else if (value.length > 200) {
        msg = "Address must be less than 200 characters";
      } else if (/[<>{}[\]\\|`~^]/.test(value)) {
        msg = "Address contains invalid characters";
      } else if (/^[a-zA-Z0-9]{1,3}[!@#$%&*()_+=:;'",.?/\\-]/.test(value)) {
        // Block addresses that START with 1-3 letters/numbers followed by special chars (like "hyd@#")
        msg = "Address must start with a proper address";
      } else if (/([!@#$%&*()_+=:;'",.?/\\-]){4,}/.test(value)) {
        msg = "Too many consecutive special characters";
      } else if (value.replace(/[a-zA-Z0-9\s]/g, '').length > value.replace(/\s/g, '').length * 0.3) {
        msg = "Address contains too many special characters";
      }
    }

    if (field === "contact") {
      if (!value) {
        msg = "Contact is required";
      } else if (!/^\d+$/.test(value)) {
        msg = "Only numbers allowed";
      } else if (value.length !== 10) {
        msg = "Must be exactly 10 digits";
      } else if (/^0{5,}/.test(value)) {
        msg = "Invalid contact number (too many leading zeros)";
      } else if (/^(\d)\1{9}$/.test(value)) {
        msg = "Invalid contact number (all same digits)";
      }
    }

    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field, value) => {
    if (field === "contact" && !/^\d*$/.test(value)) return;
    
    if (field === "name" && /[<>{}[\]\\|`~^]/.test(value)) return;

    if (field === "name") setFarmerName(value);
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
    if (field === "name") return farmerName;
    if (field === "address") return address;
    if (field === "contact") return contact;
  };

  const addFarmer = async () => {
    setTouched({ name: true, address: true, contact: true });

    validateField("name", farmerName);
    validateField("address", address);
    validateField("contact", contact);

    if (
      errors.name ||
      errors.address ||
      errors.contact ||
      !farmerName ||
      !address ||
      !contact
    ) return;

    try {
      await axios.post("http://localhost:5001/api/farmers", {
        name: farmerName.trim(),
        address: address.trim(),
        contact: contact.trim(),
      });

      fetchFarmers();

      setFarmerName("");
      setAddress("");
      setContact("");
      setErrors({});
      setTouched({});
    } catch (error) {
      console.error("Error adding farmer:", error);
      setErrors(prev => ({ ...prev, general: "Failed to add farmer" }));
    }
  };

  const isFormValid =
    farmerName &&
    address &&
    contact &&
    !errors.name &&
    !errors.address &&
    !errors.contact;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Farmer Onboarding</h2>

        <div style={styles.field}>
          <input
            style={{
              ...styles.input,
              borderColor: touched.name && errors.name ? "#ff4444" : 
                          isValidField("name") ? "#4CAF50" : "#ccc"
            }}
            placeholder="Farmer Name"
            value={farmerName}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={(e) => handleBlur("name", e.target.value)}
          />
          {isValidField("name") && <span style={styles.tick}>✔</span>}
          {touched.name && errors.name && (
            <div style={styles.error}>{errors.name}</div>
          )}
        </div>

        <div style={styles.field}>
          <input
            style={{
              ...styles.input,
              borderColor: touched.address && errors.address ? "#ff4444" : 
                          isValidField("address") ? "#4CAF50" : "#ccc"
            }}
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

        <div style={styles.field}>
          <input
            style={{
              ...styles.input,
              borderColor: touched.contact && errors.contact ? "#ff4444" : 
                          isValidField("contact") ? "#4CAF50" : "#ccc"
            }}
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
          onClick={addFarmer}
          disabled={!isFormValid}
        >
          Add Farmer
        </button>
      </div>

      <div style={styles.listCard}>
        <h3>Farmers List</h3>
        <ul>
          {farmers.map((f) => (
            <li key={f.id} style={styles.listItem}>
              <b>{f.name}</b> | {f.address} | {f.contact}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

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
    transition: "border-color 0.3s",
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
    transition: "background-color 0.3s",
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