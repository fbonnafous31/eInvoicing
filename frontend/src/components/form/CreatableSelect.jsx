// frontend/src/components/form/CreatableSelect.jsx
import React from "react";
import Creatable from "react-select/creatable";

export default function CreatableSelect({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error = "",
  required = false,
  disabled = false,
  placeholder = "",
  options = [],
  isClearable = true,
  formatCreateLabel,
  feedbackText = "",     // Texte à afficher en dessous
  feedbackClass = "",    // Classe CSS du feedback (ex: "text-success" ou "text-warning")
  ...props
}) {
  const showError = Boolean(error) || (required && !value);

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={id || name} className="form-label">
          {label} {required && "*"}
        </label>
      )}

      <Creatable
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={() => onBlur?.(name)}
        options={options}
        isClearable={isClearable}
        isDisabled={disabled}
        placeholder={placeholder}
        formatCreateLabel={formatCreateLabel}
        styles={{
          control: (provided, state) => ({
            ...provided,
            backgroundColor: state.isDisabled ? "#e8ebeefa" : "#fff",
            borderColor: showError ? "#dc3545" : "#ced4da",
            boxShadow: state.isFocused
              ? "0 0 0 0.2rem rgba(0,123,255,.25)"
              : "none",
            "&:hover": { borderColor: "#adb5bd" },
          }),
          singleValue: (provided) => ({ ...provided, color: "#212529" }),
          input: (provided) => ({ ...provided, color: "#212529" }),
          placeholder: (provided) => ({ ...provided, color: "#6c757d" }),
          menu: (provided) => ({ ...provided, backgroundColor: "#fff", zIndex: 9999 }),
        }}
        {...props}
      />

      {showError && (
        <small className="text-danger">{error || "Ce champ est obligatoire"}</small>
      )}

      {!showError && feedbackText && (
        <small className={feedbackClass}>{feedbackText}</small>
      )}
    </div>
  );
}