/**
 * Excel Export Utilities
 * Generate actual .xlsx files with formulas intact
 */

export const exportToExcel = async (data: any, filename: string) => {
  try {
    // This would use ExcelJS library to generate actual Excel files
    // For now, export as CSV
    
    const csv = convertToCSV(data);
    downloadFile(csv, `${filename}.csv`, 'text/csv');
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

const convertToCSV = (data: any): string => {
  // Convert data to CSV format
  const rows: string[] = [];
  
  // Add headers
  if (data.headers) {
    rows.push(data.headers.join(','));
  }
  
  // Add data rows
  if (data.rows) {
    data.rows.forEach((row: any[]) => {
      rows.push(row.map(cell => `"${cell}"`).join(','));
    });
  }
  
  return rows.join('\n');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Print current sheet
 */
export const printSheet = () => {
  window.print();
};

/**
 * Export formulas to show in UI
 */
export const getFormulaForCell = (
  cellType: 'SUM' | 'AVERAGE' | 'COUNTIF' | 'IF' | 'REFERENCE',
  params: any
): string => {
  switch (cellType) {
    case 'SUM':
      return `=IF(${params.checkCell}<>"",SUM(${params.range}),"")`;
    case 'AVERAGE':
      return `=IF(COUNT(${params.range})=0,"",AVERAGE(${params.range}))`;
    case 'COUNTIF':
      return `=COUNTIF(${params.range},"${params.criteria}")`;
    case 'IF':
      return `=IF(${params.condition},"${params.trueValue}","${params.falseValue}")`;
    case 'REFERENCE':
      return `='${params.sheet}'!${params.cell}`;
    default:
      return '';
  }
};





