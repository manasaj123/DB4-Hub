import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import SalesOrder from "./components/SalesOrder";
import Delivery from "./components/Delivery";
import Billing from "./components/Billing";
import Reports from "./components/Reports";

const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(45deg, #11998e, #38ef7d)",
    fontFamily: "Arial, sans-serif"
  },
  authWrapper: {
    width: "360px",
    paddingBottom: "16px"
  },
  authBottomText: {
    textAlign: "center",
    marginTop: "8px",
    color: "#fff"
  },
  authLinkButton: {
    border: "none",
    background: "none",
    color: "#0044cc",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
    fontSize: "14px"
  },
  appShell: {
    width: "95%",
    maxWidth: "1100px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "10px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
    padding: "20px 24px",
    boxSizing: "border-box"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px"
  },
  title: {
    margin: 0,
    color: "#0b3c5d"
  },
  nav: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center"
  },
  navButton: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    fontSize: "14px"
  },
  logoutButton: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#fd140c",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px"
  },
  userInfo: {
    fontSize: "12px",
    color: "#666",
    marginRight: "8px"
  },
  roleBadge: {
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "bold"
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authView, setAuthView] = useState("login");
  const [view, setView] = useState("orders");
  const [userRole, setUserRole] = useState("viewer");
  const [userEmail, setUserEmail] = useState("");

  // Decode token to get user info and role
  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log("Token decoded:", payload);
        
        setUserRole(payload.role || "viewer");
        setUserEmail(payload.email || "");
      } catch (e) {
        console.error("Error decoding token:", e);
        setUserRole("viewer");
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUserRole("viewer");
    setUserEmail("");
  };

  if (!token) {
    if (authView === "register") {
      return (
        <div style={styles.page}>
          <div style={styles.authWrapper}>
            <Register
              onRegisterSuccess={() => setAuthView("login")}
              switchToLogin={() => setAuthView("login")}
            />
          </div>
        </div>
      );
    }

    return (
      <div style={styles.page}>
        <div style={styles.authWrapper}>
          <Login onLogin={(newToken) => {
            setToken(newToken);
            localStorage.setItem("token", newToken);
          }} />
          <p style={styles.authBottomText}>
            No account?{" "}
            <button
              type="button"
              style={styles.authLinkButton}
              onClick={() => setAuthView("register")}
            >
              Register
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.appShell}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.title}>Sales Order – Delivery – Billing</h2>
            {userEmail && (
              <span style={styles.userInfo}>
                Logged in as: <strong>{userEmail}</strong>
                <span style={{
                  ...styles.roleBadge,
                  backgroundColor: userRole === "admin" ? "#d4edda" : "#cce5ff",
                  color: userRole === "admin" ? "#155724" : "#004085",
                  marginLeft: "8px"
                }}>
                  {userRole === "admin" ? "🔧 Admin" : "👁️ Viewer"}
                </span>
              </span>
            )}
          </div>
          <nav style={styles.nav}>
            <button style={styles.navButton} onClick={() => setView("orders")}>
              📋 Orders
            </button>
            <button style={styles.navButton} onClick={() => setView("billing")}>
              💰 Billing
            </button>
            <button style={styles.navButton} onClick={() => setView("delivery")}>
              🚚 Delivery
            </button>
            
            <button style={styles.navButton} onClick={() => setView("reports")}>
              📊 Reports
            </button>
            <button style={styles.logoutButton} onClick={handleLogout}>
              🚪 Logout
            </button>
          </nav>
        </header>

        {/* Pass token AND userRole to all components */}
        {view === "orders" && <SalesOrder token={token} userRole={userRole} />}
        {view === "delivery" && <Delivery token={token} userRole={userRole} />}
        {view === "billing" && <Billing token={token} userRole={userRole} />}
        {view === "reports" && <Reports token={token} userRole={userRole} />}
      </div>
    </div>
  );
}

export default App;