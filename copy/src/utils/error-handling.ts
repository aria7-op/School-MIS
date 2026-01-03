// Error handling utilities
export interface AppError {
  message: string;
  code: string;
  statusCode?: number;
  details?: any;
}

export class CustomError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const handleApiError = (error: any): AppError => {
  if (error instanceof CustomError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error.response) {
    return {
      message: error.response.data?.message || 'API Error',
      code: error.response.data?.code || 'API_ERROR',
      statusCode: error.response.status,
      details: error.response.data,
    };
  }

  return {
    message: error.message || 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    details: error,
  };
};
