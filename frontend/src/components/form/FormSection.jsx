import React from "react";

export default function FormSection({
  title,
  sectionKey,
  openSections,
  toggleSection,
  hasError,
  children,
}) {
  return (
    <div className="mb-4 border p-3 rounded">
      <button
        type="button"
        className="btn btn-link p-0 mb-2"
        onClick={() => toggleSection(sectionKey)}
      >
        {title} {openSections[sectionKey] ? "▲" : "▼"}{" "}
        {hasError && <span className="text-danger">⚠️</span>}
      </button>
      {openSections[sectionKey] && <div>{children}</div>}
    </div>
  );
}
