import React from 'react';

export default function InvoiceLines({ data, onChange }) {
  const handleLineChange = (index, e) => {
    const newLines = [...data];
    newLines[index][e.target.name] = e.target.value;
    onChange(newLines);
  };

  const addLine = () => 
    onChange([
      ...data, 
      { description: '', quantity: 1, unit_price: 0, vat_rate: 20, discount: 0, line_net: 0, line_tax: 0, line_total: 0 }
    ]);

  const removeLine = (index) => onChange(data.filter((_, i) => i !== index));

  return (
    <div className="card p-3 mb-3">
      <h5>Lignes de facture</h5>
      {data.map((line, index) => (
        <div key={index} className="mb-2 d-flex gap-2 align-items-center">
          <input 
            name="description" 
            placeholder="Description" 
            value={line.description} 
            onChange={e => handleLineChange(index, e)} 
            className="form-control" 
          />
          <input 
            type="number" 
            name="quantity" 
            placeholder="Quantité" 
            value={line.quantity} 
            onChange={e => handleLineChange(index, e)} 
            className="form-control" 
          />
          <input 
            type="number" 
            name="unit_price" 
            placeholder="Prix unitaire" 
            value={line.unit_price} 
            onChange={e => handleLineChange(index, e)} 
            className="form-control" 
          />
          <input 
            type="number" 
            name="vat_rate" 
            placeholder="TVA (%)" 
            value={line.vat_rate} 
            onChange={e => handleLineChange(index, e)} 
            className="form-control" 
          />
          <input 
            type="number" 
            name="discount" 
            placeholder="Remise" 
            value={line.discount} 
            onChange={e => handleLineChange(index, e)} 
            className="form-control" 
          />

          {/* Champs calculés en lecture seule */}
          <input 
            type="number" 
            placeholder="Montant HT" 
            value={line.line_net?.toFixed(2) || 0} 
            className="form-control" 
            readOnly 
          />
          <input 
            type="number" 
            placeholder="TVA" 
            value={line.line_tax?.toFixed(2) || 0} 
            className="form-control" 
            readOnly 
          />
          <input 
            type="number" 
            placeholder="TTC" 
            value={line.line_total?.toFixed(2) || 0} 
            className="form-control" 
            readOnly 
          />

          <button type="button" className="btn btn-danger" onClick={() => removeLine(index)}>-</button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary mt-2" onClick={addLine}>Ajouter une ligne</button>
    </div>
  );
}
