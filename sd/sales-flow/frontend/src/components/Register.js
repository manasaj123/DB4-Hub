import React, { useState } from "react";
import { registerApi } from "../api/authApi";

const styles = {
  container: {
    background: "linear-gradient(45deg, #06143fff, #0d253aff)",
    width: "360px",
    padding: "24px",
    borderRadius: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    fontFamily: "Arial, sans-serif",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    color: "#fff"
  },
  title: {
    textAlign: "center",
    marginBottom: "16px"
  },
  input: {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box"
  },
  select: {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    backgroundColor: "white",
    fontSize: "14px"
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: "10px"
  },
  passwordInput: {
    width: "100%",
    padding: "8px 40px 8px 8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box"
  },
  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#666",
    fontSize: "18px",
    padding: "2px",
    lineHeight: "1"
  },
  button: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#5b799aff",
    color: "#fff",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold"
  },
  linkButton: {
    border: "none",
    background: "none",
    color: "#1976d2",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline"
  },
  error: {
    color: "#ff4444",
    marginBottom: "8px",
    textAlign: "center",
    fontSize: "13px",
    padding: "8px",
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderRadius: "4px"
  },
  success: {
    color: "#00c851",
    marginBottom: "8px",
    textAlign: "center",
    fontSize: "13px",
    padding: "8px",
    backgroundColor: "rgba(0, 200, 81, 0.1)",
    borderRadius: "4px"
  },
  footerText: {
    marginTop: "10px",
    textAlign: "center",
    fontSize: "14px"
  },
  strengthMeter: {
    fontSize: "12px",
    marginTop: "-8px",
    marginBottom: "8px",
    textAlign: "left"
  },
  strengthBar: {
    height: "4px",
    marginTop: "2px",
    borderRadius: "2px",
    transition: "width 0.3s, background-color 0.3s"
  },
  roleInfo: {
    fontSize: "11px",
    color: "#aaa",
    marginTop: "-8px",
    marginBottom: "10px",
    textAlign: "left"
  }
};

const Register = ({ onRegisterSuccess, switchToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer"); // Default role: viewer
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    level: 0,
    text: "",
    color: ""
  });

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) {
      setPasswordStrength({ level: 0, text: "", color: "" });
      return;
    }

    let score = 0;
    
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;

    let strengthLevel = 0;
    let strengthText = "";
    let strengthColor = "";

    if (score <= 1) {
      strengthLevel = 25;
      strengthText = "Very Weak - Add more characters";
      strengthColor = "#ff4444";
    } else if (score <= 2) {
      strengthLevel = 40;
      strengthText = "Weak - Mix uppercase, lowercase & numbers";
      strengthColor = "#ff8c00";
    } else if (score <= 3) {
      strengthLevel = 60;
      strengthText = "Medium - Getting better";
      strengthColor = "#ffd700";
    } else if (score <= 4) {
      strengthLevel = 80;
      strengthText = "Strong - Add special characters";
      strengthColor = "#9acd32";
    } else {
      strengthLevel = 100;
      strengthText = "Very Strong - Excellent!";
      strengthColor = "#00c851";
    }

    setPasswordStrength({
      level: strengthLevel,
      text: strengthText,
      color: strengthColor
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const lowercaseEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!emailRegex.test(lowercaseEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("Password must contain uppercase, lowercase and numbers");
      return;
    }

    try {
      // Pass role to register API
      await registerApi(name.trim(), lowercaseEmail, password, role);
      setMessage("Registration successful! You can now login.");
      setName("");
      setEmail("");
      setPassword("");
      setRole("viewer");
      setPasswordStrength({ level: 0, text: "", color: "" });
      if (onRegisterSuccess) onRegisterSuccess(lowercaseEmail, password);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    calculatePasswordStrength(e.target.value);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Register</h2>
      
      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.success}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          style={styles.input}
          placeholder="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <input
          style={styles.input}
          placeholder="Email Address *"
          type="email"
          value={email}
          onChange={handleEmailChange}
          required
        />
        
       
        
        <div style={styles.passwordWrapper}>
          <input
            style={styles.passwordInput}
            placeholder="Password *"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <button
            type="button"
            style={styles.eyeButton}
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
        
        {passwordStrength.text && (
          <div style={styles.strengthMeter}>
            <div style={{ marginBottom: "2px", color: passwordStrength.color }}>
              {passwordStrength.text}
            </div>
            <div style={{
              ...styles.strengthBar,
              width: `${passwordStrength.level}%`,
              backgroundColor: passwordStrength.color
            }} />
          </div>
        )}

         {/* Role Selection Dropdown */}
        <select
          style={styles.select}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="viewer"> Viewer </option>
          <option value="admin"> Admin</option>
        </select>
        <div style={styles.roleInfo}>
          {role === "admin" 
            ? "Admin can create, edit, and delete data" 
            : "Viewer can only view data (read-only access)"}
        </div>
        
        <button style={styles.button} type="submit">
          Register as {role === "admin" ? "Admin" : "Viewer"}
        </button>
      </form>

      <p style={styles.footerText}>
        Already have an account?{" "}
        <button type="button" style={styles.linkButton} onClick={switchToLogin}>
          Login
        </button>
      </p>
    </div>
  );
};

export default Register;