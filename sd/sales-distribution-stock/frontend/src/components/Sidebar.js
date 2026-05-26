import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {/* MATERIAL MASTER */}

        <NavLink to="/material-stock" className={linkClass}>
          {/* Create Material Stock */}
          Material Master
        </NavLink>

        {/* NEW: STOCK MANAGEMENT */}
        <NavLink to="/stock-management" className={linkClass}>
          Stock Management
        </NavLink>

        <NavLink to="/material-sales-view" className={linkClass}>
          MM For Sales View
        </NavLink>

        {/* CUSTOMER MASTER */}

        <NavLink to="/customers" className={linkClass}>
          Customers
        </NavLink>

        <NavLink to="/customer-account-groups" className={linkClass}>
          Customer Account Groups
        </NavLink>

        {/* PRE SALES */}
        <NavLink to="/pre-sales-activities" className={linkClass}>
          Pre-Sales Activities
        </NavLink>

        <NavLink to="/inquiry" className={linkClass}>
          Create Quotations
        </NavLink>

        {/* SALES DOCUMENT CONFIG */}

        <NavLink to="/sales-document-config" className={linkClass}>
          Defining Sales Document
        </NavLink>

        <NavLink to="/item-categories-config" className={linkClass}>
          Item Categories
        </NavLink>

        <NavLink to="/schedule-line" className={linkClass}>
          Schedule Line Categories
        </NavLink>

        {/* PRICING */}

        <NavLink to="/pricing-config" className={linkClass}>
          Pricing
        </NavLink>

        <NavLink to="/conditions" className={linkClass}>
          Condition Records
        </NavLink>

        {/* SALES ORDER */}

        <NavLink to="/creation-of-sales-order" className={linkClass}>
          Creation of Sales Order
        </NavLink>

        <NavLink to="/agreement" className={linkClass}>
          Outline Agreements
        </NavLink>

        <NavLink to="/quota" className={linkClass}>
          Quota Arrangement
        </NavLink>

        {/* DELIVERY */}

        <NavLink to="/shipping" className={linkClass}>
          Shipping
        </NavLink>

        <NavLink to="/route" className={linkClass}>
          Route Determination
        </NavLink>

        <NavLink to="/outbound-delivery" className={linkClass}>
          Outbound Delivery
        </NavLink>

        <NavLink to="/picking" className={linkClass}>
          Picking / Packing / PGI
        </NavLink>

        <NavLink to="/pgi" className={linkClass}>
          Post Goods Issue
        </NavLink>

        {/* BILLING */}

        <NavLink to="/billing" className={linkClass}>
          Billing
        </NavLink>

        {/* CREDIT MANAGEMENT */}

        <NavLink to="/credit" className={linkClass}>
          Credit Management
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
