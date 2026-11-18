import React from 'react';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ children, className = '', ...props }: CardProps) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
};
