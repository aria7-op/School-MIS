import React from 'react';

/**
 * Excel-style Status Bar (bottom)
 * Shows calculation mode, cell count, statistics
 */
interface ExcelStatusBarProps {
  totalStudents: number;
  totalSubjects: number;
  calculationMode: 'Auto' | 'Manual';
  isEditMode: boolean;
  selectedRange?: string;
  sum?: number;
  average?: number;
  count?: number;
}

const ExcelStatusBar: React.FC<ExcelStatusBarProps> = ({
  totalStudents,
  totalSubjects,
  calculationMode,
  isEditMode,
  selectedRange,
  sum,
  average,
  count
}) => {
  const totalCells = totalStudents * totalSubjects * 2; // midterm + annual

  return (
    <div className="border-t border-gray-300 bg-gray-100 px-4 py-1.5 flex items-center justify-between text-xs">
      {/* Left Side - Selection Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="material-icons text-sm text-gray-600">grid_on</span>
          <span className="text-gray-700 font-medium">
            {totalStudents} students × {totalSubjects} subjects × 2 = {totalCells} cells
          </span>
        </div>
        
        {selectedRange && (
          <>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">Selection: {selectedRange}</span>
          </>
        )}

        {count !== undefined && (
          <>
            <span className="text-gray-400">|</span>
            <div className="flex items-center gap-3">
              {sum !== undefined && (
                <span className="text-gray-700">Sum: <span className="font-semibold">{sum.toFixed(2)}</span></span>
              )}
              {average !== undefined && (
                <span className="text-gray-700">Average: <span className="font-semibold">{average.toFixed(2)}</span></span>
              )}
              <span className="text-gray-700">Count: <span className="font-semibold">{count}</span></span>
            </div>
          </>
        )}
      </div>

      {/* Right Side - Status Info */}
      <div className="flex items-center gap-4">
        <span className="text-gray-600">
          Calculation: <span className="font-semibold text-green-600">{calculationMode}</span>
        </span>
        <span className="text-gray-400">|</span>
        <span className={`font-semibold ${isEditMode ? 'text-blue-600' : 'text-gray-600'}`}>
          {isEditMode ? '✏️ Edit Mode' : '👁️ View Mode'}
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600">
          <span className="material-icons text-sm align-middle">check_circle</span>
          <span className="ml-1">Ready</span>
        </span>
      </div>
    </div>
  );
};

export default ExcelStatusBar;





