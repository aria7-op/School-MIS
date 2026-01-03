import React from 'react';
import { FloatingActionButtonProps } from '../types/finance';
import Tooltip from './Tooltip';

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  label 
}) => {
  const getTooltipContent = () => {
    switch (label.toLowerCase()) {
      case 'add payment':
        return 'Create a new payment record for a student';
      case 'add expense':
        return 'Record a new school expense or operational cost';
      case 'add payroll':
        return 'Add a new payroll entry for staff or teachers';
      default:
        return `Add new ${label.toLowerCase()}`;
    }
  };

  return (
    <Tooltip content={getTooltipContent()} position="left">
      <button
        onClick={onClick}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 z-50"
        aria-label={label}
      >
        <div className="flex items-center space-x-2">
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
          <span className="font-medium text-sm hidden sm:block">{label}</span>
        </div>
      </button>
    </Tooltip>
  );
};

export default FloatingActionButton;