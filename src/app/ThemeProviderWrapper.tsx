"use client";

import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import React from "react";

const theme = createTheme({
  palette: {
    primary: {
      main: "#B8860B", // Dark Goldenrod
    },
    background: {
      default: "#333333", // Charcoal background
      paper: "#333333",   // Charcoal background
    },
    text: {
      primary: "#FFFFFF", // White text for input field and main text
      secondary: "#000000", // Black for icons or secondary text
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            backgroundColor: '#000000', // Black background for input field
            color: '#FFFFFF', // White text in input field
            borderRadius: 5,
          },
          '& .MuiInputLabel-root': {
            color: '#FFFFFF', // White color for input label
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#B8860B', // Dark Goldenrod
          color: '#000000', // Black for icon button
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.1)', // Scale up on hover
          },
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
