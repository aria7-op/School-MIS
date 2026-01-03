import React from 'react';

/**
 * Excel-style Formula Bar
 * Shows selected cell address and formula
 */
interface ExcelFormulaBarProps {
  selectedCell: string;
  formula: string;
  value: any;
  showFormulas: boolean;
  onToggleFormulas: () => void;
}

const ExcelFormulaBar: React.FC<ExcelFormulaBarProps> = ({
  selectedCell,
  formula,
  value,
  showFormulas,
  onToggleFormulas
}) => {
  return (
    <div className="border-b border-gray-300 bg-gray-50 flex items-center gap-2 p-2">
      {/* Name Box */}
      <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
        <div className="w-24 border border-gray-300 rounded px-2 py-1 bg-white text-sm font-semibold text-center">
          {selectedCell || 'A1'}
        </div>
      </div>

      {/* Formula Bar */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm font-bold text-gray-700">fx</span>
        <div className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white font-mono text-sm">
          {showFormulas ? (
            <span className="text-blue-600">{formula || value}</span>
          ) : (
            <span className="text-gray-800">{value}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
        <button
          onClick={onToggleFormulas}
          className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 font-medium"
          title="Ctrl+`"
        >
          {showFormulas ? '🔢 Values' : 'ƒx Formulas'}
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Print">
          <span className="material-icons text-lg">print</span>
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Download Excel">
          <span className="material-icons text-lg">download</span>
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Settings">
          <span className="material-icons text-lg">settings</span>
        </button>
      </div>
    </div>
  );
};

export default ExcelFormulaBar;





