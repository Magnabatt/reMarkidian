export const darkTheme = {
  colors: {
    // Primary colors
    primary: '#00d4ff',
    primaryDark: '#0099cc',
    primaryLight: '#33ddff',
    
    // Background colors
    background: '#0a0a0a',
    backgroundSecondary: '#1a1a1a',
    backgroundTertiary: '#2a2a2a',
    
    // Surface colors
    surface: '#1e1e1e',
    surfaceHover: '#2e2e2e',
    surfaceActive: '#3e3e3e',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    textMuted: '#666666',
    textDisabled: '#404040',
    
    // Border colors
    border: '#333333',
    borderLight: '#404040',
    borderDark: '#1a1a1a',
    
    // Status colors
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff4757',
    info: '#00d4ff',
    
    // Accent colors
    accent: '#ff6b6b',
    accentSecondary: '#4ecdc4',
    
    // Code/syntax colors
    code: '#f8f8f2',
    codeBackground: '#282a36',
    
    // Gradient colors
    gradientPrimary: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
    gradientSecondary: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    gradientDark: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
  },
  
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
  },
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(0, 212, 255, 0.3)',
    glowStrong: '0 0 30px rgba(0, 212, 255, 0.5)',
  },
  
  transitions: {
    fast: '0.15s ease-in-out',
    base: '0.2s ease-in-out',
    slow: '0.3s ease-in-out',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

export default darkTheme;
