import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

interface FormErrorProps {
  error?: string;
  id?: string;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ 
  error, 
  id,
  className = '' 
}) => {
  if (!error) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-2 text-red-600 text-sm mt-1 ${className}`}
    >
      <FiAlertCircle className="flex-shrink-0" aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
};

export default FormError;



