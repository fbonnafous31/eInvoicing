export function CheckboxField({ id, name, label, checked, onChange, disabled }) {
  return (
    <div className="form-check mb-2">
      <input
        type="checkbox"
        className="form-check-input"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
