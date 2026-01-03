import secureApiService from '../../../services/secureApiService';
import { API_BASE_URL } from '../../../constants/api';

export interface CardGenerationResponse {
  success: boolean;
  data?: {
    filePath: string;
    filename: string;
    student: {
      id: string;
      userId: string;
      name: string;
      parentName: string;
      admissionNo: string;
      className: string;
      classCode: string;
    };
  };
  error?: string;
  message?: string;
}

export interface CardPrintCountResponse {
  success: boolean;
  data?: {
    printCount: number;
  };
  error?: string;
  message?: string;
}

class CardService {
  /**
   * Generate student card
   */
  async generateStudentCard(studentId: number): Promise<CardGenerationResponse> {
    try {
      console.log('🔍 CardService: Generating card for student:', studentId);
      
      // Get the card as a blob - getBlob returns the blob directly
      const blob = await secureApiService.getBlob(`/students/${studentId}/card`);
      
      if (blob) {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `student-card-${studentId}.jpg`; // Changed to .jpg since backend generates JPEG
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Card download triggered successfully');
        
        return {
          success: true,
          data: {
            filePath: `student-card-${studentId}.jpg`,
            filename: `student-card-${studentId}.jpg`,
            student: {
              id: studentId.toString(),
              userId: '',
              name: '',
              parentName: '',
              admissionNo: '',
              className: '',
              classCode: ''
            }
          }
        };
      } else {
        throw new Error('No card data received');
      }
    } catch (error) {
      console.error('Error generating student card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate card'
      };
    }
  }

  /**
   * Get student card print count
   */
  async getCardPrintCount(studentId: number): Promise<CardPrintCountResponse> {
    try {
      const response = await secureApiService.get(`/students/${studentId}/card/print-count`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            printCount: response.data.printCount || 0
          }
        };
      } else {
        throw new Error(response.message || 'Failed to get print count');
      }
    } catch (error) {
      console.error('Error getting card print count:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get print count'
      };
    }
  }
}

export default new CardService();