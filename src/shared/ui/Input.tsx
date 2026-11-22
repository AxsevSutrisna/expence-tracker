import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Teks bantuan kecil di bawah input (menjelaskan maksud/hasil pengisian). */
  hint?: React.ReactNode;
}

export const Input = ({ label, hint, id, className = '', ...props }: InputProps) => {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input id={inputId} className="input-field" aria-describedby={hintId} {...props} />
      {hint && (
        <p id={hintId} className="input-hint">
          {hint}
        </p>
      )}
    </div>
  );
};
