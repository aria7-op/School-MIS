import React, { useState } from 'react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}>({});

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className={`relative ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  const context = React.useContext(SelectContext);
  
  return (
    <button
      type="button"
      className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      onClick={() => context?.setIsOpen?.(!context.isOpen)}
    >
      {children}
      <svg className="absolute right-2 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className = '' }) => {
  const context = React.useContext(SelectContext);
  
  return (
    <span className={`block truncate ${className}`}>
      {context?.value || placeholder}
    </span>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  const context = React.useContext(SelectContext);
  
  if (!context?.isOpen) {
    return null;
  }
  
  return (
    <div className={`absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg ${className}`}>
      <div className="max-h-60 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className = '' }) => {
  const context = React.useContext(SelectContext);
  
  return (
    <div
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => {
        context?.onValueChange?.(value);
        context?.setIsOpen?.(false);
      }}
    >
      {children}
    </div>
  );
};

export default Select;
