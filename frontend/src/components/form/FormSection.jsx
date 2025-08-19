import React from 'react';

export default function FormSection({ title, sectionKey, openSections, toggleSection, hasError, children }) {
  return (
    <div className="mb-3">
      <button
        type="button"
        className="btn btn-link p-0 mb-2"
        onClick={() => toggleSection(sectionKey)}
      >
        {title} {openSections[sectionKey] ? '▲' : '▼'} {hasError && '⚠️'}
      </button>
      {openSections[sectionKey] && children}
    </div>
  );
}
