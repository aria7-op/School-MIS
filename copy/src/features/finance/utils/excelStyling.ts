import * as XLSX from 'xlsx';

// Helper function to apply styling to Excel sheets
export const applySheetStyling = (sheet: XLSX.WorkSheet, titleRow: number, headerRow: number, dataStartRow: number) => {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Style title row (if it exists and is within range)
  if (titleRow >= range.s.r && titleRow <= range.e.r) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: titleRow, c: col });
      if (sheet[cellAddress]) {
        sheet[cellAddress].s = {
          font: { bold: true, size: 16, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "6366F1" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }
  }
  
  // Style header row
  if (headerRow >= range.s.r && headerRow <= range.e.r) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      if (sheet[cellAddress]) {
        sheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "8B5CF6" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "6D28D9" } },
            bottom: { style: "thin", color: { rgb: "6D28D9" } },
            left: { style: "thin", color: { rgb: "6D28D9" } },
            right: { style: "thin", color: { rgb: "6D28D9" } }
          }
        };
      }
    }
  }
  
  // Style data rows with alternating colors
  for (let row = dataStartRow; row <= range.e.r; row++) {
    const isEven = (row - dataStartRow) % 2 === 0;
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (sheet[cellAddress]) {
        sheet[cellAddress].s = {
          fill: { fgColor: { rgb: isEven ? "F8F9FA" : "FFFFFF" } },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            처리bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };
      }
    }
  }
};





