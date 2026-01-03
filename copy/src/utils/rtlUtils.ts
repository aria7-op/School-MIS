import { useTranslation } from 'react-i18next';

/**
 * RTL (Right-to-Left) utility functions for proper spacing and layout
 */

export const useRTL = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'fa-AF' || i18n.language === 'ps-AF';
  
  return { isRTL, language: i18n.language };
};

/**
 * Get appropriate spacing classes based on RTL direction
 * These functions take isRTL as a parameter instead of calling hooks
 */
export const getRTLSpacing = {
  // Icon to text spacing
  iconText: (isRTL: boolean, baseSpacing: string = 'ml-3') => {
    return isRTL ? baseSpacing.replace('ml-', 'mr-') : baseSpacing;
  },
  
  // Icon container positioning
  iconContainer: (isRTL: boolean, basePosition: string = 'left-0 pl-3') => {
    if (isRTL) {
      return basePosition
        .replace('left-0', 'right-0')
        .replace('pl-', 'pr-');
    }
    return basePosition;
  },
  
  // Input padding adjustment
  inputPadding: (isRTL: boolean, basePadding: string = 'pl-10') => {
    if (isRTL) {
      return basePadding
        .replace('pl-', 'pr-')
        .replace('pr-', 'pl-');
    }
    return basePadding;
  },
  
  // Button gap spacing
  buttonGap: (isRTL: boolean, baseGap: string = 'gap-2') => {
    // For RTL, we might want slightly more spacing
    return isRTL ? 'gap-3' : baseGap;
  },
  
  // Error message spacing
  errorIcon: (isRTL: boolean, baseSpacing: string = 'mr-3') => {
    return isRTL ? baseSpacing.replace('mr-', 'ml-') : baseSpacing;
  }
};

/**
 * Get RTL-aware CSS classes for common patterns
 */
export const getRTLClasses = {
  // Container with proper direction
  container: (isRTL: boolean) => {
    return isRTL ? 'rtl' : 'ltr';
  },
  
  // Flex direction for RTL
  flexDirection: (isRTL: boolean, baseDirection: string = 'flex-row') => {
    return isRTL ? 'flex-row-reverse' : baseDirection;
  },
  
  // Text alignment
  textAlign: (isRTL: boolean, baseAlign: string = 'text-left') => {
    return isRTL ? 'text-right' : baseAlign;
  },
  
  // Icon positioning in buttons
  buttonIcon: (isRTL: boolean) => {
    return isRTL ? 'order-2' : 'order-1';
  },
  
  // Text positioning in buttons
  buttonText: (isRTL: boolean) => {
    return isRTL ? 'order-1' : 'order-2';
  }
};

/**
 * Enhanced spacing for RTL languages
 */
export const getEnhancedRTLSpacing = {
  // Metric card spacing - much more generous for RTL to match LTR visual quality
  metricCard: (isRTL: boolean) => {
    return isRTL ? 'ml-8' : 'ml-3';
  },
  
  // Search icon spacing
  searchIcon: (isRTL: boolean) => {
    return isRTL ? 'pr-8' : 'pl-3';
  },
  
  // Search input padding
  searchInput: (isRTL: boolean) => {
    return isRTL ? 'pr-16 pl-3' : 'pl-10 pr-3';
  },
  
  // Error message spacing
  errorMessage: (isRTL: boolean) => {
    return isRTL ? 'ml-8' : 'mr-3';
  },
  
  // Button gap with enhanced spacing
  buttonGap: (isRTL: boolean) => {
    return isRTL ? 'gap-6' : 'gap-2';
  },
  
  // Icon container spacing for better RTL balance
  iconContainer: (isRTL: boolean) => {
    return isRTL ? 'p-4' : 'p-2';
  },
  
  // Text container spacing for RTL
  textContainer: (isRTL: boolean) => {
    return isRTL ? 'ml-8' : 'ml-3';
  },
  
  // Enhanced spacing for metric cards
  metricCardSpacing: (isRTL: boolean) => {
    return isRTL ? 'space-x-8' : 'space-x-3';
  },
  
  // Extra generous spacing for RTL to truly match LTR visual quality
  extraGenerousSpacing: (isRTL: boolean) => {
    return isRTL ? 'ml-10' : 'ml-3';
  },
  
  // Icon-text gap that matches LTR visual balance
  iconTextGap: (isRTL: boolean) => {
    return isRTL ? 'gap-8' : 'gap-3';
  }
};
