import InputField from "../form/InputField";

export default function InvoiceLines({ data, onChange }) {
  const handleLineChange = (index, field, value) => {
    const newLines = [...data];
    newLines[index][field] = value;

    // recalcul des montants HT, TVA, TTC
    const qty = parseFloat(newLines[index].quantity) || 0;
    const price = parseFloat(newLines[index].unit_price) || 0;
    const vat = parseFloat(newLines[index].vat_rate) || 0;
    const discount = parseFloat(newLines[index].discount) || 0;

    newLines[index].line_net = qty * price - discount;
    newLines[index].line_tax = (newLines[index].line_net * vat) / 100;
    newLines[index].line_total = newLines[index].line_net + newLines[index].line_tax;

    onChange(newLines);
  };

  const addLine = () =>
    onChange([
      ...data,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        vat_rate: 20,
        discount: 0,
        line_net: 0,
        line_tax: 0,
        line_total: 0,
      },
    ]);

  const removeLine = (index) => onChange(data.filter((_, i) => i !== index));

  return (
    <div className="card p-3 mb-3">
      <h5 className="mb-3">Lignes de facture</h5>

      {data.map((line, index) => (
        <div key={index} className="mb-3 border rounded p-3">
          <div className="d-grid" style={{ gridTemplateColumns: "2fr 0.8fr 1fr 0.8fr 0.8fr 1fr 1fr 1fr 60px", gap: "0.5rem" }}>
            <InputField
              id={`description_${index}`}
              name="description"
              label="Description"
              value={line.description}
              onChange={(e) => handleLineChange(index, "description", e.target.value)}
              required
            />

            <InputField
              id={`quantity_${index}`}
              name="quantity"
              type="number"
              label="Quantité"
              value={line.quantity}
              onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
              required
            />

            <InputField
              id={`unit_price_${index}`}
              name="unit_price"
              type="number"
              label="Prix unitaire (€)"
              value={line.unit_price}
              onChange={(e) => handleLineChange(index, "unit_price", e.target.value)}
              required
            />

            <InputField
              id={`vat_rate_${index}`}
              name="vat_rate"
              type="number"
              label="TVA (%)"
              value={line.vat_rate}
              onChange={(e) => handleLineChange(index, "vat_rate", e.target.value)}
              required
            />

            <InputField
              id={`discount_${index}`}
              name="discount"
              type="number"
              label="Remise (€)"
              value={line.discount}
              onChange={(e) => handleLineChange(index, "discount", e.target.value)}
            />

            <InputField
              id={`line_net_${index}`}
              name="line_net"
              type="number"
              label="HT"
              value={line.line_net?.toFixed(2) || 0}
              readOnly
            />

            <InputField
              id={`line_tax_${index}`}
              name="line_tax"
              type="number"
              label="TVA"
              value={line.line_tax?.toFixed(2) || 0}
              readOnly
            />

            <InputField
              id={`line_total_${index}`}
              name="line_total"
              type="number"
              label="TTC"
              value={line.line_total?.toFixed(2) || 0}
              readOnly
            />

            <div className="d-flex flex-column align-items-center">
              <label className="invisible">Action</label>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeLine(index)}
              >
                🗑️
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
