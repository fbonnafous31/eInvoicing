import React from 'react';

export default function TaxBases({ data, onChange }) {
  const handleTaxChange = (index, e) => {
    const newTaxes = [...data];
    newTaxes[index][e.target.name] = e.target.value;

    // Calcul automatique du montant de la taxe
    const base_amount = parseFloat(newTaxes[index].base_amount) || 0;
    const vat_rate = parseFloat(newTaxes[index].vat_rate) || 0;
    newTaxes[index].tax_amount = (base_amount * vat_rate) / 100;

    onChange(newTaxes);
  };

  const addTax = () => 
    onChange([...data, { vat_rate: 20, base_amount: 0, tax_amount: 0 }]);

  const removeTax = (index) => onChange(data.filter((_, i) => i !== index));

  return (
    <div className="card p-3 mb-3">
      <h5>Assiettes de TVA</h5>

      {/* Intitulés des colonnes */}
      <div className="d-flex gap-2 mb-2 fw-bold">
        <div style={{ flex: 2 }}>TVA (%)</div>
        <div style={{ flex: 2 }}>Base HT</div>
        <div style={{ flex: 2 }}>Montant TVA</div>
        <div style={{ width: '50px' }}></div>
      </div>

      {data.map((tax, index) => (
        <div key={index} className="mb-2 d-flex gap-2 align-items-center w-100">
          <input 
            type="number" 
            name="vat_rate" 
            placeholder="TVA (%)" 
            value={tax.vat_rate} 
            onChange={e => handleTaxChange(index, e)} 
            className="form-control" 
            style={{ flex: 2 }}
          />
          <input 
            type="number" 
            name="base_amount" 
            placeholder="Base"  
            value={tax.base_amount} 
            onChange={e => handleTaxChange(index, e)} 
            className="form-control" 
            style={{ flex: 2 }}
          />
          <input 
            type="number" 
            placeholder="Montant TVA" 
            value={tax.tax_amount?.toFixed(2) || 0} 
            className="form-control" 
            style={{ flex: 2 }}
            readOnly 
          />
          <button type="button" className="btn btn-danger" onClick={() => removeTax(index)}>🗑️</button>
        </div>
      ))}

      <button type="button" className="btn btn-secondary mt-2" onClick={addTax}>Ajouter une assiette</button>
    </div>
  );
}
