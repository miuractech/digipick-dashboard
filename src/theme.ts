import type{ MantineThemeOverride } from '@mantine/core';
export const theme: MantineThemeOverride = {
  fontFamily: "'Inter', sans-serif",
  fontSizes: { xs: '12px', sm: '14px', md: '16px', lg: '18px', xl: '20px' },
  primaryShade: 6,
  defaultRadius: 'md',
  colors: {
    primary: [
      "#f0f1fe", "#d6d8fa", "#b8bcf7", "#989ef3", "#7a81f0", "#5D5FEF", "#4a4bcc", "#3939a9", "#292786", "#1a1763"
    ],
    secondary: [
      "#fbeeea", "#f6d3c5", "#f1b79f", "#ec9b79", "#e87f53", "#e0623a", "#b44d2d", "#883820", "#5c2413", "#301006"
    ]
  },
  primaryColor: 'primary',
};