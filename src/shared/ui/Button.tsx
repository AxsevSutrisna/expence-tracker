import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', className = '', ...props }, ref) => {
    return (
      <button ref={ref} className={`btn btn-${variant} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
