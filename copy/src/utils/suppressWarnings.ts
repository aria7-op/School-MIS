// Utility to suppress React Native web warnings in development
export const suppressReactNativeWebWarnings = () => {
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    console.warn = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Invalid DOM property') ||
         message.includes('Unknown event handler property') ||
         message.includes('transform-origin') ||
         message.includes('onStartShouldSetResponder') ||
         message.includes('onResponderTerminationRequest') ||
         message.includes('onResponderGrant') ||
         message.includes('onResponderMove') ||
         message.includes('onResponderRelease') ||
         message.includes('onResponderTerminate') ||
         message.includes('TouchableMixin is deprecated') ||
         message.includes('props.pointerEvents is deprecated') ||
         message.includes('shadow*') ||
         message.includes('SSRProvider is not necessary') ||
         message.includes('Request to access cookie or storage') ||
         message.includes('content blocking is enabled') ||
         message.includes('It will be ignored') ||
         message.includes('Did you mean') ||
         message.includes('Invalid style property') ||
         message.includes('Please use long-form properties') ||
         message.includes('outline') ||
         message.includes('long-form properties') ||
         message.includes('Unexpected text node') ||
         message.includes('cannot be a child of') ||
         message.includes('aria-label for accessibility') ||
         message.includes('value prop on select should not be null') ||
         message.includes('Consider using an empty string') ||
         message.includes('uncontrolled components') ||
         message.includes('is not a valid icon name') ||
         message.includes('for family') ||
         message.includes('MouseEvent.mozInputSource is deprecated') ||
         message.includes('Use PointerEvent.pointerType instead') ||
         message.includes('XHR') ||
         message.includes('GET') ||
         message.includes('HTTP') ||
         message.includes('localhost:8081'))
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };
    
    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Invalid DOM property') ||
         message.includes('Unknown event handler property') ||
         message.includes('transform-origin') ||
         message.includes('onStartShouldSetResponder') ||
         message.includes('onResponderTerminationRequest') ||
         message.includes('onResponderGrant') ||
         message.includes('onResponderMove') ||
         message.includes('onResponderRelease') ||
         message.includes('onResponderTerminate') ||
         message.includes('TouchableMixin is deprecated') ||
         message.includes('props.pointerEvents is deprecated') ||
         message.includes('shadow*') ||
         message.includes('SSRProvider is not necessary') ||
         message.includes('Request to access cookie or storage') ||
         message.includes('content blocking is enabled') ||
         message.includes('It will be ignored') ||
         message.includes('Did you mean') ||
         message.includes('Invalid style property') ||
         message.includes('Please use long-form properties') ||
         message.includes('outline') ||
         message.includes('long-form properties') ||
         message.includes('Unexpected text node') ||
         message.includes('cannot be a child of') ||
         message.includes('aria-label for accessibility') ||
         message.includes('value prop on select should not be null') ||
         message.includes('Consider using an empty string') ||
         message.includes('uncontrolled components') ||
         message.includes('is not a valid icon name') ||
         message.includes('for family') ||
         message.includes('MouseEvent.mozInputSource is deprecated') ||
         message.includes('Use PointerEvent.pointerType instead') ||
         message.includes('XHR') ||
         message.includes('GET') ||
         message.includes('HTTP') ||
         message.includes('localhost:8081'))
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
  }
};

// Call this function early in your app initialization
export const initializeWarningSuppression = () => {
  suppressReactNativeWebWarnings();
  
  // Also suppress React DevTools message
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Download the React DevTools') ||
         message.includes('Development-level warnings: ON') ||
         message.includes('Performance optimizations: OFF'))
      ) {
        return;
      }
      originalConsoleLog.apply(console, args);
    };
    
    // Suppress React internal warnings more aggressively
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Invalid DOM property') ||
         message.includes('Unknown event handler property') ||
         message.includes('transform-origin') ||
         message.includes('onStartShouldSetResponder') ||
         message.includes('onResponderTerminationRequest') ||
         message.includes('onResponderGrant') ||
         message.includes('onResponderMove') ||
         message.includes('onResponderRelease') ||
         message.includes('onResponderTerminate') ||
         message.includes('It will be ignored') ||
         message.includes('Did you mean') ||
         message.includes('Invalid style property') ||
         message.includes('Please use long-form properties') ||
         message.includes('outline') ||
         message.includes('long-form properties') ||
         message.includes('Unexpected text node') ||
         message.includes('cannot be a child of') ||
         message.includes('aria-label for accessibility') ||
         message.includes('value prop on select should not be null') ||
         message.includes('Consider using an empty string') ||
         message.includes('uncontrolled components') ||
         message.includes('is not a valid icon name') ||
         message.includes('for family') ||
         message.includes('MouseEvent.mozInputSource is deprecated') ||
         message.includes('Use PointerEvent.pointerType instead') ||
         message.includes('XHR') ||
         message.includes('GET') ||
         message.includes('HTTP') ||
         message.includes('localhost:8081') ||
         message.includes('value prop on select') ||
         message.includes('should not be null') ||
         message.includes('value prop on select should not be null') ||
         message.includes('Consider using an empty string') ||
         message.includes('uncontrolled components') ||
         message.includes('is not a valid icon name') ||
         message.includes('for family') ||
         message.includes('MouseEvent.mozInputSource is deprecated') ||
         message.includes('Use PointerEvent.pointerType instead') ||
         message.includes('XHR') ||
         message.includes('GET') ||
         message.includes('HTTP') ||
         message.includes('outline') ||
         message.includes('long-form properties') ||
         message.includes('Unexpected text node') ||
         message.includes('cannot be a child of') ||
         message.includes('aria-label for accessibility') ||
         message.includes('value prop on select') ||
         message.includes('should not be null') ||
         message.includes('value prop on select should not be null') ||
         message.includes('Consider using an empty string') ||
         message.includes('uncontrolled components'))
      ) {
        return;
      }
      originalError.apply(console, args);
    };
    
    // Also suppress console.warn for the same messages
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('Invalid DOM property') ||
         message.includes('Unknown event handler property') ||
         message.includes('transform-origin') ||
         message.includes('onStartShouldSetResponder') ||
         message.includes('onResponderTerminationRequest') ||
         message.includes('onResponderGrant') ||
         message.includes('onResponderMove') ||
         message.includes('onResponderRelease') ||
         message.includes('onResponderTerminate') ||
         message.includes('It will be ignored') ||
         message.includes('Did you mean') ||
         message.includes('Invalid style property') ||
         message.includes('Please use long-form properties') ||
         message.includes('outline') ||
         message.includes('long-form properties') ||
         message.includes('Unexpected text node') ||
         message.includes('cannot be a child of') ||
         message.includes('aria-label for accessibility') ||
         message.includes('value prop on select should not be null') ||
         message.includes('Consider using an empty string') ||
         message.includes('uncontrolled components') ||
         message.includes('is not a valid icon name') ||
         message.includes('for family') ||
         message.includes('MouseEvent.mozInputSource is deprecated') ||
         message.includes('Use PointerEvent.pointerType instead') ||
         message.includes('XHR') ||
         message.includes('GET') ||
         message.includes('HTTP') ||
         message.includes('localhost:8081') ||
         message.includes('value prop on select') ||
         message.includes('should not be null') ||
         message.includes('value prop on select should not be null') ||
         message.includes('Consider using an empty string') ||
         message.includes('uncontrolled components') ||
         message.includes('is not a valid icon name') ||
         message.includes('for family') ||
         message.includes('MouseEvent.mozInputSource is deprecated') ||
         message.includes('Use PointerEvent.pointerType instead') ||
         message.includes('XHR') ||
         message.includes('GET') ||
         message.includes('HTTP') ||
         message.includes('outline') ||
         message.includes('long-form properties') ||
         message.includes('Unexpected text node') ||
         message.includes('cannot be a child of') ||
         message.includes('aria-label for accessibility') ||
         message.includes('value prop on select') ||
         message.includes('should not be null') ||
         message.includes('value prop on select should not be null') ||
         message.includes('Consider using an empty string') ||
         message.includes('uncontrolled components'))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };
  }
}; 
