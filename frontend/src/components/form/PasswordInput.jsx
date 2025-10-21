import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ id, name, label, value, onChange, disabled, error, helpText }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative w-full">
      <label htmlFor={id} className="block mb-1 font-medium text-gray-700">{label}</label>
      <input
        type={show ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`border p-2 w-full rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full p-1 transition-all duration-200 shadow-sm"
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      {helpText && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
