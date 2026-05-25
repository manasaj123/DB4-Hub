// frontend/src/pages/Journal.js
import React, { useEffect, useState } from "react";
import api from "../api";

const emptyLine = {
  glAccount: "",
  debit: "",
  credit: "",
  costCenterId: "",
  profitCenterId: "",
  narration: "",
};

const ALLOWED_DOC_TYPES = ["SA", "AB", "KG", "RV", "WA", "WI"];
const Journal = () => {
  const [header, setHeader] = useState({
    documentDate: "",
    postingDate: "",
    documentType: "SA",
    reference: "",
    headerText: "",
    companyCode: "DB4",
    status: "POSTED",
  });

  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [journalSummary, setJournalSummary] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [selectedLines, setSelectedLines] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  const computeTotals = (currentLines) => {
    const d = currentLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const c = currentLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    setTotalDebit(d);
    setTotalCredit(c);
  };

  const loadSummary = async () => {
    setSaving(true);
    try {
      const res = await api.get("/journal");
      setJournalSummary(res.data || []);
    } catch (err) {
      console.error(
        "Journal summary load error",
        err.response?.data || err.message,
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSummary().catch(console.error);
  }, []);

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      computeTotals(updated);
      return updated;
    });
  };

  const addLine = () => {
    setLines((prev) => {
      const updated = [...prev, { ...emptyLine }];
      computeTotals(updated);
      return updated;
    });
  };

  const removeLine = (index) => {
    setLines((prev) => {
      if (prev.length === 1) return prev;
      const updated = prev.filter((_, i) => i !== index);
      computeTotals(updated);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!header.documentDate || !header.postingDate || !header.companyCode) {
      setError("Document date, posting date and company code are required");
      setSubmitting(false);
      return;
    }
    console.log("Submitting lines:", lines);

    // Validate lines: non-empty G/L and either debit or credit
    if (
      lines.some((l) => {
        const gl = l.glAccount?.toString().trim();
        const debit = Number(l.debit) || 0;
        const credit = Number(l.credit) || 0;

        return (
          !gl ||
          debit < 0 ||
          credit < 0 ||
          (debit > 0 && credit > 0) ||
          (debit === 0 && credit === 0)
        );
      })
    ) {
      setError("Each line needs a G/L account and either debit or credit");
      setSubmitting(false);
      return;
    }

    if (totalDebit.toFixed(2) !== totalCredit.toFixed(2)) {
      setError("Total debit and credit must be equal");
      setSubmitting(false);
      return;
    }

    try {
      const cleanLines = lines.map((l) => ({
        glAccount: l.glAccount.trim(),
        debit: l.debit ? Number(l.debit) : 0,
        credit: l.credit ? Number(l.credit) : 0,
        costCenterId: l.costCenterId || null,
        profitCenterId: l.profitCenterId || null,
        narration: l.narration || "",
      }));

      const payload = { header, lines: cleanLines };
      const res = await api.post("/journal", payload);
      setSuccess(`Journal posted. Doc No: ${res.data.documentNumber}`);

      // reset
      // Reset all header fields, including dates
      setHeader({
        documentDate: "",
        postingDate: "",
        documentType: "SA",
        reference: "",
        headerText: "",
        companyCode: "DB4",
        status: "POSTED",
      });
      setLines([{ ...emptyLine }]);
      computeTotals([{ ...emptyLine }]);
      await loadSummary();
    } catch (err) {
      console.error("Journal save error", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to post journal");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (headerRow) => {
    setSelectedHeader(headerRow);
    setShowModal(true);
    setModalLoading(true);
    setModalError("");
    try {
      const res = await api.get(`/journal/${headerRow.id}/lines`);
      setSelectedLines(res.data.lines || []);
    } catch (err) {
      console.error(
        "Journal lines load error",
        err.response?.data || err.message,
      );
      setModalError(err.response?.data?.message || "Failed to load lines");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedHeader(null);
    setSelectedLines([]);
  };

  return (
    <div>
      <style>{`
        .card {
          background-color: #ffffff;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 1rem;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem 1rem;
        }
        .form-grid-2 label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        .form-grid-2 input,
        .form-grid-2 select,
        .form-grid-2 textarea {
          width: 100%;
          padding: 0.35rem 0.5rem;
          border: 1px solid #d0d7de;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        .lines-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          margin-top: 0.75rem;
        }
        .lines-table th,
        .lines-table td {
          padding: 0.35rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .lines-table input,
        .lines-table select {
          width: 100%;
          padding: 0.25rem;
          font-size: 0.8rem;
        }
        .btn-small {
          padding: 0.25rem 0.6rem;
          font-size: 0.8rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
        }
        .btn-add {
          background-color: #10b981;
          color: #ffffff;
        }
        .btn-remove {
          background-color: #ef4444;
          color: #ffffff;
        }
        .btn-primary {
          margin-top: 0.75rem;
          padding: 0.4rem 1rem;
          border-radius: 4px;
          border: none;
          background-color: #2563eb;
          color: #ffffff;
          cursor: pointer;
        }
        .error-text {
          color: #b91c1c;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .success-text {
          color: #15803d;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .table th,
        .table td {
          padding: 0.45rem 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .link-button {
          background: none;
          border: none;
          color: #2563eb;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          font-size: 0.85rem;
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #ffffff;
          border-radius: 6px;
          width: 800px;
          max-width: 95%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header,
        .modal-footer {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-footer {
          border-top: 1px solid #e5e7eb;
          border-bottom: none;
        }
        .modal-body {
          padding: 0.75rem;
          overflow: auto;
        }
        .btn-secondary {
          padding: 0.35rem 0.9rem;
          border-radius: 4px;
          border: none;
          background-color: #e5e7eb;
          cursor: pointer;
        }
      `}</style>

      <h2>Journal Entries</h2>

      <div className="grid-2">
        <div className="card">
          <h3>Create Journal</h3>
          {error && <div className="error-text">{error}</div>}
          {success && <div className="success-text">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div>
                <label>Document Date *</label>
                <input
                  type="date"
                  name="documentDate"
                  value={header.documentDate}
                  onChange={handleHeaderChange}
                  required
                />
              </div>
              <div>
                <label>Posting Date *</label>
                <input
                  type="date"
                  name="postingDate"
                  value={header.postingDate}
                  onChange={handleHeaderChange}
                  required
                />
              </div>
              <div>
                <label>Doc Type</label>
                {/* Changed to select dropdown */}
                <select
                  name="documentType"
                  value={header.documentType}
                  onChange={handleHeaderChange}
                >
                  {ALLOWED_DOC_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Company Code *</label>
                <input
                  name="companyCode"
                  value={header.companyCode}
                  onChange={handleHeaderChange}
                  required
                  maxLength={4}
                />
              </div>
              <div>
                <label>Reference</label>
                <input
                  name="reference"
                  value={header.reference}
                  onChange={handleHeaderChange}
                  maxLength={16}
                />
              </div>
              <div>
                <label>Status</label>
                <select
                  name="status"
                  value={header.status}
                  onChange={handleHeaderChange}
                >
                  <option value="POSTED">Posted</option>
                  <option value="HELD">Held</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Header Text</label>
                <textarea
                  name="headerText"
                  value={header.headerText}
                  onChange={handleHeaderChange}
                  rows={2}
                  maxLength={50}
                />
              </div>
            </div>

            <h4 style={{ marginTop: "0.75rem" }}>Lines</h4>
            <table className="lines-table">
              <thead>
                <tr>
                  <th>G/L</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Cost Center</th>
                  <th>Profit Center</th>
                  <th>Narration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        value={line.glAccount}
                        onChange={(e) =>
                          handleLineChange(idx, "glAccount", e.target.value)
                        }
                        required
                        maxLength={20}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit}
                        onChange={(e) =>
                          handleLineChange(idx, "debit", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit}
                        onChange={(e) =>
                          handleLineChange(idx, "credit", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={line.costCenterId}
                        onChange={(e) =>
                          handleLineChange(idx, "costCenterId", e.target.value)
                        }
                        maxLength={20}
                      />
                    </td>
                    <td>
                      <input
                        value={line.profitCenterId}
                        onChange={(e) =>
                          handleLineChange(
                            idx,
                            "profitCenterId",
                            e.target.value,
                          )
                        }
                        maxLength={20}
                      />
                    </td>
                    <td>
                      <input
                        value={line.narration}
                        onChange={(e) =>
                          handleLineChange(idx, "narration", e.target.value)
                        }
                        maxLength={255}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-small btn-remove"
                        onClick={() => removeLine(idx)}
                      >
                        -
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="7">
                    <button
                      type="button"
                      className="btn-small btn-add"
                      onClick={addLine}
                    >
                      + Add Line
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Totals</strong>
                  </td>
                  <td>{totalDebit.toFixed(2)}</td>
                  <td>{totalCredit.toFixed(2)}</td>
                  <td colSpan="4"></td>
                </tr>
              </tbody>
            </table>

            <button className="btn-primary" type="submit" disabled={submitting}>
              {saving ? "Saving..." : "Save & Post"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Recent Journals</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Doc No</th>
                <th>Posting Date</th>
                <th>Type</th>
                <th>Company</th>
                <th>Status</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {journalSummary.map((j) => (
                <tr key={j.id}>
                  <td>{j.documentNumber}</td>
                  <td>{j.postingDate}</td>
                  <td>{j.documentType}</td>
                  <td>{j.companyCode}</td>
                  <td>{j.status}</td>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => openDetail(j)}
                    >
                      View lines
                    </button>
                  </td>
                </tr>
              ))}
              {journalSummary.length === 0 && (
                <tr>
                  <td colSpan="6">No journals yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h4>Journal {selectedHeader?.documentNumber}</h4>
                <small>
                  {selectedHeader?.postingDate} | {selectedHeader?.companyCode}{" "}
                  | {selectedHeader?.status}
                </small>
              </div>
              <button type="button" onClick={closeModal}>
                X
              </button>
            </div>
            <div className="modal-body">
              {modalLoading && <div>Loading...</div>}
              {modalError && <div className="error-text">{modalError}</div>}
              {!modalLoading && !modalError && selectedLines.length === 0 && (
                <div>No lines found.</div>
              )}
              {!modalLoading && !modalError && selectedLines.length > 0 && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>G/L</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Cost Center</th>
                      <th>Profit Center</th>
                      <th>Narration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.glAccount}</td>
                        <td>{Number(l.debit || 0).toFixed(2)}</td>
                        <td>{Number(l.credit || 0).toFixed(2)}</td>
                        <td>{l.costCenterId}</td>
                        <td>{l.profitCenterId}</td>
                        <td>{l.narration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
