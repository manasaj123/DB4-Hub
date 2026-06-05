// src/App.jsx
import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import ForecastPage from "./pages/ForecastPage";
import PlanPage from "./pages/PlanPage";
import CapacityPage from "./pages/CapacityPage";
import BatchPage from "./pages/BatchPage";
import WorkOrderPage from "./pages/WorkOrderPage";
import MRPRunPage from "./pages/MRPRunPage";
import MetricsPage from "./pages/MetricsPage";
import ProductMasterPage from "./pages/ProductMasterPage";
import BOMPage from './pages/BOMPage';

function App() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="pp-app">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          background: #f5f6f8;
        }

        .pp-app {
          display: flex;
          min-height: 100vh;
        }

        .pp-nav {
          width: 220px;
          background: #048975;
          color: white;
          padding: 20px 0;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 1000;
        }

        .pp-logo {
          padding: 0 20px 20px;
          margin-bottom: 20px;
          border-bottom: 1px solid #2a3a4a;
          font-size: 13px;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .pp-nav a {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          color: #d0d7df;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.3s;
          border-left: 3px solid transparent;
        }

        .pp-nav a:hover {
          background: #25403c;
          color: #fff;
          border-left-color: #4a90d9;
        }

        .pp-nav a.active {
          background: #253040;
          color: #fff;
          border-left-color: #007bff;
          font-weight: 600;
        }

        .pp-nav a::before {
          margin-right: 10px;
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .pp-nav a[href="/products"]::before { content: "📦"; }
        .pp-nav a[href="/forecast"]::before { content: "📊"; }
        .pp-nav a[href="/plan"]::before { content: "📋"; }
        .pp-nav a[href="/capacity"]::before { content: "⚙️"; }
        .pp-nav a[href="/batches"]::before { content: "🏭"; }
        .pp-nav a[href="/work-orders"]::before { content: "📝"; }
        .pp-nav a[href="/mrp"]::before { content: "🔧"; }
        .pp-nav a[href="/metrics"]::before { content: "📈"; }
          .pp-nav a[href="/bom"]::before { content: "🧾"; }

        .pp-main {
          flex: 1;
          margin-left: 220px;
          padding: 20px;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .pp-nav {
            width: 60px;
          }
          .pp-nav .pp-logo {
            display: none;
          }
          .pp-nav a span {
            display: none;
          }
          .pp-nav a {
            justify-content: center;
            padding: 15px;
          }
          .pp-nav a::before {
            margin-right: 0;
            font-size: 20px;
          }
          .pp-main {
            margin-left: 60px;
          }
        }
      `}</style>

      <nav className="pp-nav">
        <h3 className="pp-logo"> Production Planning</h3>
        
        <Link to="/products" className={isActive("/products")}>
          <span>Products</span>
        </Link>
        <Link to="/forecast" className={isActive("/forecast")}>
          <span>Forecast</span>
        </Link>
        <Link to="/plan" className={isActive("/plan")}>
          <span>Production Plan</span>
        </Link>
        <Link to="/capacity" className={isActive("/capacity")}>
          <span>Capacity Plan</span>
        </Link>
        <Link to="/batches" className={isActive("/batches")}>
          <span>Batches</span>
        </Link>
        <Link to="/work-orders" className={isActive("/work-orders")}>
          <span>Work Orders</span>
        </Link>
        <Link to="/bom" className={isActive("/bom")}>
          <span>BOM</span>
        </Link>
        <Link to="/mrp" className={isActive("/mrp")}>
          <span>MRP</span>
        </Link>
        <Link to="/metrics" className={isActive("/metrics")}>
          <span>Metrics</span>
        </Link>
        
      </nav>

      <main className="pp-main">
        <Routes>
          <Route path="/products" element={<ProductMasterPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/capacity" element={<CapacityPage />} />
          <Route path="/batches" element={<BatchPage />} />
          <Route path="/work-orders" element={<WorkOrderPage />} />
          <Route path="/mrp" element={<MRPRunPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/bom" element={<BOMPage />} />
          <Route path="/" element={<ForecastPage />} />
          <Route path="*" element={<ForecastPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;