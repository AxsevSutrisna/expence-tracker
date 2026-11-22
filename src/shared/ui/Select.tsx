import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  /** Teks bantuan kecil di bawah dropdown (menjelaskan maksud pilihan). */
  hint?: React.ReactNode;
  options: SelectOption[];
}

export const Select = ({ label, hint, id, options, className = '', ...props }: SelectProps) => {
  const reactId = React.useId();
  const selectId = id ?? reactId;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      <select id={selectId} className="input-field" aria-describedby={hintId} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className="input-hint">
          {hint}
        </p>
      )}
    </div>
  );
};
