// Test environment variables in React
export const testEnvironmentVariables = () => {
  // Check different ways to access environment variables
  // Check if process.env exists
  // Check window object
  if (typeof window !== 'undefined') {
    console.log('Window ENV:', (window as any).ENV);
    console.log('Window process:', (window as any).process);
  }
  
  // Check if we're in browser
  return {
    encryptionKey: process.env.REACT_APP_API_ENCRYPTION_KEY,
    apiUrl: process.env.REACT_APP_API_BASE_URL,
    hasProcess: typeof process !== 'undefined',
    hasWindow: typeof window !== 'undefined'
  };
}; 