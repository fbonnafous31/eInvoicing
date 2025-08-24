import { useState } from "react";
import InputField from "../form/InputField";
import { validateInvoiceLine } from "../../utils/validators/invoice";

export default function InvoiceLines({ data, onChange }) {
  const [errors, setErrors] = useState([]); // tableau d'erreurs par ligne
  const [touched, setTouched] = useState([]); // champs déjà visités

  const handleLineChange = (index, field, eOrValue) => {
    const value = eOrValue?.target ? eOrValue.target.value : eOrValue;
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

    // validation immédiate du champ si déjà touché
    if (touched[index]?.[field]) {
      runValidation(index, newLines[index]);
    }
  };

  const handleBlur = (index, field) => {
    setTouched((prev) => {
      const newTouched = [...prev];
      newTouched[index] = { ...newTouched[index], [field]: true };
      return newTouched;
    });
    runValidation(index, data[index]);
  };

  const runValidation = (index, line) => {
    const lineErrors = validateInvoiceLine(line);
    setErrors((prev) => {
      const newErrors = [...prev];
      newErrors[index] = lineErrors;
      return newErrors;
    });
  };

  const addLine = () => {
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
    setErrors([...errors, {}]);
    setTouched([...touched, {}]);
  };

  const removeLine = (index) => {
    onChange(data.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
    setTouched(touched.filter((_, i) => i !== index));
  };

  return (
    <div className="card p-3 mb-3">
      <h5 className="mb-3">Lignes de facture</h5>

      {data.map((line, index) => (
        <div key={index} className="mb-3 border rounded p-3">
          <div
            className="d-grid"
            style={{
              gridTemplateColumns:
                "2fr 0.8fr 1fr 0.8fr 0.8fr 1fr 1fr 1fr 60px",
              gap: "0.5rem",
            }}
          >
            <InputField
              id={`description_${index}`}
              name="description"
              label="Description"
              value={line.description}
              onChange={(val) => handleLineChange(index, "description", val)}
              onBlur={() => handleBlur(index, "description")}
              error={touched[index]?.description && errors[index]?.description}
              required
            />

            <InputField
              id={`quantity_${index}`}
              name="quantity"
              type="number"
              label="Quantité"
              value={line.quantity}
              onChange={(val) => handleLineChange(index, "quantity", val)}
              onBlur={() => handleBlur(index, "quantity")}
              error={touched[index]?.quantity && errors[index]?.quantity}
              required
            />

            <InputField
              id={`unit_price_${index}`}
              name="unit_price"
              type="number"
              label="Prix unitaire (€)"
              value={line.unit_price}
              onChange={(val) => handleLineChange(index, "unit_price", val)}
              onBlur={() => handleBlur(index, "unit_price")}
              error={touched[index]?.unit_price && errors[index]?.unit_price}
              required
            />

            <InputField
              id={`vat_rate_${index}`}
              name="vat_rate"
              type="number"
              label="TVA (%)"
              value={line.vat_rate}
              onChange={(val) => handleLineChange(index, "vat_rate", val)}
              onBlur={() => handleBlur(index, "vat_rate")}
              error={touched[index]?.vat_rate && errors[index]?.vat_rate}
              required
            />

            <InputField
              id={`discount_${index}`}
              name="discount"
              type="number"
              label="Remise (€)"
              value={line.discount}
              onChange={(val) => handleLineChange(index, "discount", val)}
              onBlur={() => handleBlur(index, "discount")}
              error={touched[index]?.discount && errors[index]?.discount}
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
