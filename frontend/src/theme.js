import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data-toolpad-color-scheme" },
  colorSchemes: { light: true, dark: true },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif',
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
});

export default theme;
