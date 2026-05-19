import { useState, useEffect } from "react";
import axios from "axios";

export default function Collection() {
  const [farmers, setFarmers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [collections, setCollections] = useState([]);

  const [partyType, setPartyType] = useState("");
  const [partyId, setPartyId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [qty, setQty] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    fetchFarmers();
    fetchCustomers();
    fetchMaterials();
    fetchCollections();
  }, []);

  const fetchFarmers = async () => {
    const res = await axios.get("http://localhost:5001/api/farmers");
    setFarmers(res.data);
  };

  const fetchCustomers = async () => {
    const res = await axios.get("http://localhost:5001/api/customers");
    setCustomers(res.data);
  };

  const fetchMaterials = async () => {
    const res = await axios.get("http://localhost:5001/api/materials");
    setMaterials(res.data);
  };

  const fetchCollections = async () => {
    const res = await axios.get("http://localhost:5001/api/collections");
    setCollections(res.data);
  };

  // ✅ FIX: LOCAL DATE FORMAT (NO TIMEZONE ISSUE)
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // ✅ EXPIRY CALCULATION
  const calculateExpiry = (date, materialIdValue) => {
    const material = materials.find(m => m.id === Number(materialIdValue));
    if (!material || !material.shelf_life) return "";

    const exp = new Date(date);
    exp.setDate(exp.getDate() + Number(material.shelf_life));

    return formatDate(exp); // ✅ FIXED
  };

  // ✅ MFG CHANGE
  const handleMfgChange = (date) => {
    setMfgDate(date);

    if (materialId) {
      const expDate = calculateExpiry(date, materialId);
      setExpiryDate(expDate);
    }
  };

  // ✅ SAVE COLLECTION
  const saveCollection = async () => {
    if (!partyType || !partyId || !materialId || !qty || !expiryDate) {
      return alert("All fields are required");
    }

    const material = materials.find(m => m.id === Number(materialId));

    if (!material) {
      alert("Invalid material");
      return;
    }

    if (Number(qty) <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    if (Number(qty) > Number(material.qty)) {
      alert(`Only ${material.qty} available`);
      return;
    }

    // ✅ EXTRA SAFETY CHECK
    if (partyType === "farmer" && mfgDate) {
      if (new Date(expiryDate) < new Date(mfgDate)) {
        alert("Expiry cannot be before MFG date");
        return;
      }
    }

    try {
      await axios.post("http://localhost:5001/api/collections", {
  partyType,
  partyId,
  materialId,
  qty: Number(qty),
  mfgDate: partyType === "farmer" ? mfgDate : null,
  expiryDate
});

      fetchCollections();

      setPartyType("");
      setPartyId("");
      setMaterialId("");
      setQty("");
      setMfgDate("");
      setExpiryDate("");
    } catch (err) {
      console.error("Error saving collection:", err);
      alert("Failed to save collection");
    }
  };

  return (
    <div className="container">
      <h2>Collection App</h2>

      {/* PARTY TYPE */}
      <label>
        <input
          type="radio"
          value="farmer"
          checked={partyType === "farmer"}
          onChange={() => {
            setPartyType("farmer");
            setPartyId("");
            setMfgDate("");
            setExpiryDate("");
          }}
        /> Farmer
      </label>

      <label style={{ marginLeft: "20px" }}>
        <input
          type="radio"
          value="customer"
          checked={partyType === "customer"}
          onChange={() => {
            setPartyType("customer");
            setPartyId("");
            setMfgDate("");
            setExpiryDate("");
          }}
        /> Customer
      </label>

      <br /><br />

      {/* PARTY SELECT */}
      {partyType === "farmer" && (
        <select value={partyId} onChange={e => setPartyId(e.target.value)}>
          <option value="">Select Farmer</option>
          {farmers.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      )}

      {partyType === "customer" && (
        <select value={partyId} onChange={e => setPartyId(e.target.value)}>
          <option value="">Select Customer</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {/* MATERIAL */}
      <select
        value={materialId}
        onChange={e => {
          const value = e.target.value;
          setMaterialId(value);

          if (mfgDate) {
            const expDate = calculateExpiry(mfgDate, value);
            setExpiryDate(expDate);
          }
        }}
      >
        <option value="">Select Material</option>
        {materials.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      {/* QUANTITY */}
      <input
        type="number"
        placeholder="Quantity"
        value={qty}
        onChange={e => setQty(e.target.value)}
      />

      {/* MFG DATE */}
      {partyType === "farmer" && (
        <input
          type="date"
          value={mfgDate}
          onChange={e => handleMfgChange(e.target.value)}
        />
      )}

      {/* EXPIRY DATE */}
      <input
        type="date"
        value={expiryDate}
        onChange={e => setExpiryDate(e.target.value)}
      />

      <br /><br />

      <button onClick={saveCollection}>Save Collection</button>

      <br /><br />

      {/* TABLE */}
      {collections.length > 0 && (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Party</th>
              <th>Material</th>
              <th>Quantity</th>
              <th>MFG Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {collections.map(c => (
              <tr key={c.id}>
                <td>{c.partyName}</td>
                <td>{c.materialName}</td>
                <td>{c.qty}</td>
                <td>{c.mfg_date ? formatDate(c.mfg_date) : "-"}</td>
                <td>{formatDate(c.expiry_date)}</td>
                <td>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}