"use client";

import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import React from "react";

const theme = createTheme({
  palette: {
    primary: {
      main: "#006400", // forest green
    },
    secondary: {
      main: "#8FBC8F", // dark sea green
    },
    background: {
      default: "#F0FFF0", // honeydew
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#006400",
          color: "#FFD700",
        },
      },
    },
  },
});


const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeProviderWrapper;
