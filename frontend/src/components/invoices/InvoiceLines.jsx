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
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: 20,
        discount: 0,
        line_net: 0,
        line_tax: 0,
        line_total: 0
      }
    ]);

  const removeLine = (index) => onChange(data.filter((_, i) => i !== index));

  return (
    <div className="card p-3 mb-3">
      <h5 className="mb-3">Lignes de facture</h5>

      {data.map((line, index) => (
        <div key={index} className="mb-3 border rounded p-3">
          <div className="d-flex flex-wrap gap-3 align-items-end">
            <div className="flex-grow-1">
              <label className="form-label">Description</label>
              <input
                name="description"
                value={line.description}
                onChange={(e) => handleLineChange(index, e)}
                className="form-control"
                placeholder="Ex: Prestation de service"
              />
            </div>

            <div style={{ width: '100px' }}>
              <label className="form-label">Quantité</label>
              <input
                type="number"
                name="quantity"
                value={line.quantity}
                onChange={(e) => handleLineChange(index, e)}
                className="form-control"
              />
            </div>

            <div style={{ width: '150px' }}>
              <label className="form-label">Prix unitaire (€)</label>
              <input
                type="number"
                name="unit_price"
                value={line.unit_price}
                onChange={(e) => handleLineChange(index, e)}
                className="form-control"
              />
            </div>

            <div style={{ width: '100px' }}>
              <label className="form-label">TVA (%)</label>
              <input
                type="number"
                name="vat_rate"
                value={line.vat_rate}
                onChange={(e) => handleLineChange(index, e)}
                className="form-control"
              />
            </div>

            <div style={{ width: '120px' }}>
              <label className="form-label">Remise (€)</label>
              <input
                type="number"
                name="discount"
                value={line.discount}
                onChange={(e) => handleLineChange(index, e)}
                className="form-control"
              />
            </div>

            <div style={{ width: '120px' }}>
              <label className="form-label">HT</label>
              <input
                type="number"
                value={line.line_net?.toFixed(2) || 0}
                className="form-control"
                readOnly
              />
            </div>

            <div style={{ width: '120px' }}>
              <label className="form-label">TVA</label>
              <input
                type="number"
                value={line.line_tax?.toFixed(2) || 0}
                className="form-control"
                readOnly
              />
            </div>

            <div style={{ width: '120px' }}>
              <label className="form-label">TTC</label>
              <input
                type="number"
                value={line.line_total?.toFixed(2) || 0}
                className="form-control"
                readOnly
              />
            </div>

            <div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeLine(index)}
              >
                -
              </button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-secondary mt-2" onClick={addLine}>
        Ajouter une ligne
      </button>
    </div>
  );
}
