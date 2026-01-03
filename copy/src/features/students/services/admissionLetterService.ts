import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { StudentFormData } from '../components/types';
import ReactDOM from 'react-dom/client';
import React from 'react';
import AdmissionLetter from '../components/AdmissionLetter';

/**
 * Get school information from localStorage or default
 */
const getSchoolInfo = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.school) {
      return {
        name: user.school.name || 'Khwanzay School',
        shortName: user.school.shortName || 'Khwanzay',
        code: user.school.code || 'KHS'
      };
    }
  } catch {
    // Ignore errors
  }
  return {
    name: 'Khwanzay School',
    shortName: 'Khwanzay',
    code: 'KHS'
  };
};

/**
 * Generate PDF from Admission Letter component
 * @param studentData - Student form data
 * @param admissionNumber - Generated admission number
 * @returns Promise<Blob> - PDF blob
 */
export const generateAdmissionLetterPDF = async (
  studentData: StudentFormData,
  admissionNumber: string
): Promise<Blob> => {
  // Get school info
  const schoolInfo = getSchoolInfo();

  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width in pixels at 96 DPI
  document.body.appendChild(container);

  try {
    // Render the AdmissionLetter component into the container
    const root = ReactDOM.createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(AdmissionLetter, {
          studentData,
          admissionNumber,
          schoolInfo
        })
      );
      // Wait for rendering
      setTimeout(resolve, 1500);
    });

    // Convert the rendered component to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      windowHeight: 1123 // A4 height
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // Get PDF as blob
    const pdfBlob = pdf.output('blob');

    // Cleanup
    root.unmount();
    document.body.removeChild(container);

    return pdfBlob;
  } catch (error) {
    // Cleanup on error
    document.body.removeChild(container);
    throw error;
  }
};

/**
 * Download admission letter as PDF
 * @param studentData - Student form data
 * @param admissionNumber - Generated admission number
 */
export const downloadAdmissionLetter = async (
  studentData: StudentFormData,
  admissionNumber: string
): Promise<void> => {
  try {
    const pdfBlob = await generateAdmissionLetterPDF(studentData, admissionNumber);

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admission-letter-${admissionNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading admission letter:', error);
    throw new Error('Failed to generate admission letter PDF');
  }
};

export default {
  generateAdmissionLetterPDF,
  downloadAdmissionLetter
};

