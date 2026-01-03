import React from 'react';
import { EmptyStateProps } from '../types/finance';

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actions }) => {
  return (
<div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4 sm:px-6 md:px-8">
  {/* Large Bank/Building Icon */}
  <div className="mb-6 sm:mb-8">
    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
      <svg 
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M12 2L2 7v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7l-10-5zM4 9h16v8H4V9zm2 2v4h2v-4H6zm4 0v4h2v-4h-2zm4 0v4h2v-4h-2z"/>
      </svg>
    </div>
  </div>

  {/* Title */}
  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 text-center px-4">
    {title}
  </h2>

  {/* Description */}
  <p className="text-sm sm:text-base md:text-lg text-gray-600 text-center mb-6 sm:mb-8 max-w-sm sm:max-w-md md:max-w-lg leading-relaxed px-4">
    {description}
  </p>

  {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md md:max-w-lg px-4">
    {actions.map((action, index) => (
      <button
        key={index}
        onClick={action.onClick}
        className={`
          w-full sm:flex-1 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg 
          font-medium text-sm sm:text-base text-white 
          transition-all duration-200 
          transform hover:scale-105 hover:shadow-lg 
          focus:outline-none focus:ring-2 focus:ring-offset-2
          active:scale-95
          ${action.variant === 'primary' 
            ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' 
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
          }
        `}
      >
        {action.label}
      </button>
    ))}
  </div>
</div>
  );
};

export default EmptyState;