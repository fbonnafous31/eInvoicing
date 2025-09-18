import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale/fr';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePickerField.css'; // Pour les styles custom

// Enregistre la locale 'fr' pour l'utiliser dans le date-picker
registerLocale('fr', fr);

export function DatePickerField({ id, label, value, onChange, onBlur, error, required, disabled }) {
  // Pour éviter les soucis de fuseau horaire, on parse la date 'YYYY-MM-DD' manuellement.
  // new Date('2023-10-27') est interprété comme UTC, ce qui peut changer le jour.
  const selectedDate = (() => {
    if (!value) return null;
    const parts = value.split('-');
    // new Date(year, monthIndex, day) crée une date dans le fuseau horaire local.
    return new Date(parts[0], parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  })();

  const handleChange = (date) => {
    // Le date-picker retourne un objet Date. On le formate en 'YYYY-MM-DD' pour le state parent.
    if (date) {
      // On utilise les getters qui respectent le fuseau horaire local.
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange(null);
    }
  };

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <DatePicker
        id={id}
        selected={selectedDate}
        onChange={handleChange}
        onBlur={onBlur}
        dateFormat="dd/MM/yyyy"
        locale="fr"
        className={`form-control ${error ? 'is-invalid' : ''}`}
        placeholderText="jj/mm/aaaa"
        disabled={disabled}
        autoComplete="off"
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
