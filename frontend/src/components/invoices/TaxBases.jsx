import React from 'react';
import { SmallDeleteButton } from '@/components/ui/buttons';
import { InputField } from '@/components/form';

export default function TaxBases({ data, onChange, disabled, hideLabelsInView }) {
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

      {data.map((tax, index) => (
        <div key={index} className="mb-2 d-flex gap-2 align-items-center w-100">
          <InputField
            type="number"
            name="vat_rate"
            label="TVA (%)"
            value={tax.vat_rate}
            onChange={(val) => handleTaxChange(index, { target: { name: "vat_rate", value: val } })}
            disabled={disabled}
            hideLabel={hideLabelsInView}
            style={{ flex: 2 }}
          />

          <InputField
            type="number"
            name="base_amount"
            label="Base"
            value={tax.base_amount}
            onChange={(val) => handleTaxChange(index, { target: { name: "base_amount", value: val } })}
            disabled={disabled}
            hideLabel={hideLabelsInView}
            style={{ flex: 2 }}
          />

          <InputField
            type="number"
            label="Montant TVA"
            value={tax.tax_amount?.toFixed(2) || 0}
            readOnly
            disabled={disabled}
            hideLabel={hideLabelsInView}
            style={{ flex: 2 }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: '1rem' 
            }}
          >
          {!hideLabelsInView && (
            <SmallDeleteButton onClick={() => removeTax(index)} disabled={disabled} />
          )}
          </div>
        </div>
      ))}
      {!hideLabelsInView && (
        <button type="button" className="btn btn-secondary mt-2" onClick={addTax} disabled={disabled} >Ajouter une assiette</button>
      )}
    </div>
  );
}
