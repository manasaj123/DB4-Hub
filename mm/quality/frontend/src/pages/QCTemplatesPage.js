// quality/frontend/src/pages/QCTemplatesPage.js
import React, { useState } from "react";
import qcMasterApi from "../api/qcMasterApi";

export default function QCTemplatesPage() {
  const [materialId, setMaterialId] = useState("");
  const [templates, setTemplates] = useState([]);

  const loadTemplate = async () => {
    if (!materialId) return;
    const res = await qcMasterApi.getTemplate(materialId);
    setTemplates(res.data || []);
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2>Material QC Templates</h2>
      <div>
        <input 
          type="number" 
          placeholder="Enter Material ID"
          value={materialId}
          onChange={e => setMaterialId(e.target.value)}
        />
        <button onClick={loadTemplate}>Load Template</button>
      </div>
      {templates.map(t => (
        <div key={t.id}>
          {t.parameter_name} - Required: {t.required ? "✅" : "❌"}
          (Sample Size: {t.sampling_size})
        </div>
      ))}
    </div>
  );
}