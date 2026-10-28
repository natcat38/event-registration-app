import { createTheme } from '@mui/material/styles';

// Same as MUI's `theme.breakpoints.down('sm')`: phones, where fingers need 44 px targets (UX-STANDARDS S-A11Y-1).
const PHONE = '@media (max-width:599.95px)';

export const theme = createTheme({
  components: {
    // visible keyboard focus on every control
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '3px solid #1565c0',
            outlineOffset: 2,
          },
        },
      },
    },
    MuiButton: { styleOverrides: { root: { [PHONE]: { minHeight: 44 } } } },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 44 } } },
    // The registration number is the only proof of registration, so it must print without the app bar and buttons.
    MuiCssBaseline: {
      styleOverrides: {
        '@media print': { header: { display: 'none' }, '.no-print': { display: 'none' } },
      },
    },
  },
});
