import React from 'react';
import { SegmentedControlProps } from '../types/finance';
import Tooltip from './Tooltip';

const SegmentedControl: React.FC<SegmentedControlProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange 
}) => {
  const getTabTooltip = (tab: string) => {
    switch (tab.toLowerCase()) {
      case 'payments':
        return 'View and manage student payments, fees, and transactions';
      case 'expenses':
        return 'Track and manage school expenses and operational costs';
      case 'payroll':
        return 'Manage staff and teacher payroll, salaries, and benefits';
      case 'analytics':
        return 'View financial analytics, reports, and insights';
      default:
        return `View ${tab.toLowerCase()} information`;
    }
  };

  return (
    <div className="flex flex-nowrap items-center gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto whitespace-nowrap">
      {tabs.map((tab) => (
        <Tooltip key={tab} content={getTabTooltip(tab)}>
          <button
            onClick={() => onTabChange(tab)}
            className={`
              px-6 py-2 rounded-md font-medium text-sm transition-all duration-200
              ${activeTab === tab
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }
            `}
          >
            {tab}
          </button>
        </Tooltip>
      ))}
    </div>
  );
};

export default SegmentedControl;