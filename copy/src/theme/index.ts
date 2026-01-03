// Colors
export const COLORS = {
  // Primary Colors
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primary50: '#eef2ff',
  primary100: '#e0e7ff',
  primary200: '#c7d2fe',
  primary300: '#a5b4fc',
  primary400: '#818cf8',
  primary500: '#6366f1',
  primary600: '#4f46e5',
  primary700: '#4338ca',
  primary800: '#3730a3',
  primary900: '#312e81',
  
  // Secondary Colors
  secondary: '#f59e0b',
  secondaryLight: '#fbbf24',
  secondaryDark: '#d97706',
  secondary50: '#fffbeb',
  secondary100: '#fef3c7',
  secondary200: '#fde68a',
  secondary300: '#fcd34d',
  secondary400: '#fbbf24',
  secondary500: '#f59e0b',
  secondary600: '#d97706',
  secondary700: '#b45309',
  secondary800: '#92400e',
  secondary900: '#78350f',
  
  // Success Colors
  success: '#10b981',
  successLight: '#34d399',
  successDark: '#059669',
  success50: '#ecfdf5',
  success100: '#d1fae5',
  success200: '#a7f3d0',
  success300: '#6ee7b7',
  success400: '#34d399',
  success500: '#10b981',
  success600: '#059669',
  success700: '#047857',
  success800: '#065f46',
  success900: '#064e3b',
  
  // Error Colors
  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',
  error50: '#fef2f2',
  error100: '#fee2e2',
  error200: '#fecaca',
  error300: '#fca5a5',
  error400: '#f87171',
  error500: '#ef4444',
  error600: '#dc2626',
  error700: '#b91c1c',
  error800: '#991b1b',
  error900: '#7f1d1d',
  
  // Warning Colors
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  warning50: '#fffbeb',
  warning100: '#fef3c7',
  warning200: '#fde68a',
  warning300: '#fcd34d',
  warning400: '#fbbf24',
  warning500: '#f59e0b',
  warning600: '#d97706',
  warning700: '#b45309',
  warning800: '#92400e',
  warning900: '#78350f',
  
  // Info Colors
  info: '#06b6d4',
  infoLight: '#22d3ee',
  infoDark: '#0891b2',
  info50: '#ecfeff',
  info100: '#cffafe',
  info200: '#a5f3fc',
  info300: '#67e8f9',
  info400: '#22d3ee',
  info500: '#06b6d4',
  info600: '#0891b2',
  info700: '#0e7490',
  info800: '#155e75',
  info900: '#164e63',
  
  // Neutral Colors
  light: '#f8fafc',
  dark: '#0f172a',
  background: '#ffffff',
  white: '#ffffff',
  black: '#000000',
  
  // Text Colors
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textQuaternary: '#cbd5e1',
  
  // Border Colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  
  // Surface Colors
  surface: '#f8fafc',
  surfaceLight: '#ffffff',
  surfaceDark: '#f1f5f9',
  
  // Shadow Colors
  shadow: '#0f172a',
  shadowLight: '#475569',
  
  // Additional Colors
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  blue: '#3b82f6',
  teal: '#14b8a6',
  emerald: '#10b981',
  lime: '#84cc16',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  rose: '#f43f5e',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Typography
export const FONTS = {
  family: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    light: 'System',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 32,
    displayLarge: 40,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
};

// Border Radius
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Theme object for components
export const theme = {
  colors: {
    // Primary
    primary: COLORS.primary,
    primaryLight: COLORS.primaryLight,
    primaryDark: COLORS.primaryDark,
    primary50: COLORS.primary50,
    primary100: COLORS.primary100,
    primary200: COLORS.primary200,
    primary300: COLORS.primary300,
    primary400: COLORS.primary400,
    primary500: COLORS.primary500,
    primary600: COLORS.primary600,
    primary700: COLORS.primary700,
    primary800: COLORS.primary800,
    primary900: COLORS.primary900,
    
    // Secondary
    secondary: COLORS.secondary,
    secondaryLight: COLORS.secondaryLight,
    secondaryDark: COLORS.secondaryDark,
    secondary50: COLORS.secondary50,
    secondary100: COLORS.secondary100,
    secondary200: COLORS.secondary200,
    secondary300: COLORS.secondary300,
    secondary400: COLORS.secondary400,
    secondary500: COLORS.secondary500,
    secondary600: COLORS.secondary600,
    secondary700: COLORS.secondary700,
    secondary800: COLORS.secondary800,
    secondary900: COLORS.secondary900,
    
    // Success
    success: COLORS.success,
    successLight: COLORS.successLight,
    successDark: COLORS.successDark,
    success50: COLORS.success50,
    success100: COLORS.success100,
    success200: COLORS.success200,
    success300: COLORS.success300,
    success400: COLORS.success400,
    success500: COLORS.success500,
    success600: COLORS.success600,
    success700: COLORS.success700,
    success800: COLORS.success800,
    success900: COLORS.success900,
    
    // Error
    error: COLORS.error,
    errorLight: COLORS.errorLight,
    errorDark: COLORS.errorDark,
    error50: COLORS.error50,
    error100: COLORS.error100,
    error200: COLORS.error200,
    error300: COLORS.error300,
    error400: COLORS.error400,
    error500: COLORS.error500,
    error600: COLORS.error600,
    error700: COLORS.error700,
    error800: COLORS.error800,
    error900: COLORS.error900,
    
    // Warning
    warning: COLORS.warning,
    warningLight: COLORS.warningLight,
    warningDark: COLORS.warningDark,
    warning50: COLORS.warning50,
    warning100: COLORS.warning100,
    warning200: COLORS.warning200,
    warning300: COLORS.warning300,
    warning400: COLORS.warning400,
    warning500: COLORS.warning500,
    warning600: COLORS.warning600,
    warning700: COLORS.warning700,
    warning800: COLORS.warning800,
    warning900: COLORS.warning900,
    
    // Info
    info: COLORS.info,
    infoLight: COLORS.infoLight,
    infoDark: COLORS.infoDark,
    info50: COLORS.info50,
    info100: COLORS.info100,
    info200: COLORS.info200,
    info300: COLORS.info300,
    info400: COLORS.info400,
    info500: COLORS.info500,
    info600: COLORS.info600,
    info700: COLORS.info700,
    info800: COLORS.info800,
    info900: COLORS.info900,
    
    // Neutral
    light: COLORS.light,
    dark: COLORS.dark,
    background: COLORS.background,
    white: COLORS.white,
    black: COLORS.black,
    
    // Text
    text: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    textTertiary: COLORS.textTertiary,
    textQuaternary: COLORS.textQuaternary,
    
    // Border
    border: COLORS.border,
    borderLight: COLORS.borderLight,
    borderDark: COLORS.borderDark,
    
    // Surface
    surface: COLORS.surface,
    surfaceLight: COLORS.surfaceLight,
    surfaceDark: COLORS.surfaceDark,
    
    // Shadow
    shadow: COLORS.shadow,
    shadowLight: COLORS.shadowLight,
    
    // Additional
    purple: COLORS.purple,
    pink: COLORS.pink,
    indigo: COLORS.indigo,
    blue: COLORS.blue,
    teal: COLORS.teal,
    emerald: COLORS.emerald,
    lime: COLORS.lime,
    amber: COLORS.amber,
    orange: COLORS.orange,
    red: COLORS.red,
    rose: COLORS.rose,
    
    // Legacy support
    outline: COLORS.border,
    onErrorContainer: COLORS.white,
    errorContainer: COLORS.error,
  },
  spacing: SPACING,
  typography: FONTS,
  fonts: FONTS,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
};

