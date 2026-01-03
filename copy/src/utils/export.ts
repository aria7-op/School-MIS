import * as XLSX from 'xlsx';

/**
 * Export data to XLSX format
 * @param filename - The name of the file to download (e.g., 'data.xlsx')
 * @param data - Array of objects to export
 * @param sheetName - Optional name for the worksheet (default: 'Sheet1')
 */
export const exportToXLSX = (filename: string, data: any[], sheetName: string = 'Sheet1') => {
  try {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert array of objects to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths based on content
    const maxWidth = 50;
    const columnWidths = Object.keys(data[0] || {}).map(key => {
      const headerLength = key.length;
      const maxDataLength = Math.max(
        ...data.map(row => {
          const value = row[key];
          return value != null ? String(value).length : 0;
        })
      );
      return { wch: Math.min(Math.max(headerLength, maxDataLength) + 2, maxWidth) };
    });
    worksheet['!cols'] = columnWidths;

    // Style header row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '6366F1' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Write file
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting to XLSX:', error);
    throw error;
  }
};

/**
 * Export data to CSV format
 * @param filename - The name of the file to download (e.g., 'data.csv')
 * @param data - Array of objects to export
 */
export const exportToCSV = (filename: string, data: any[]) => {
  try {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Convert array of objects to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Convert to CSV string
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

