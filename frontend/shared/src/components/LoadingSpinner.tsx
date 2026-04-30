import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
// import your pulse keyframes if used
// import { pulse } from "./styles"; // example

export const LoadingSpinner: React.FC = () => {
  const spinnerSize = 48;

  const renderSpinner = (): React.ReactNode => {
    // If you use a custom animated spinner, return JSX here
    // Example: return <div style={{ animation: `${pulse} 1.5s ease-in-out infinite` }} />;
    return <CircularProgress size={spinnerSize} />;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        minHeight: 200,
      }}
    >
      {renderSpinner()}
      <Typography variant="body2" sx={{ mt: 2 }}>
        Loading...
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;