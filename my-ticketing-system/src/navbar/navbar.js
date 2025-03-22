import React from "react";
import { Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: 2,
        p: 2,
        backgroundColor: "#1B5C94",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Button
        variant="contained"
        onClick={() => navigate("/asesor")}
        sx={{
          backgroundColor: "white",
          color: "#1B5C94",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        Consultas
      </Button>
      <Button
        variant="contained"
        onClick={() => navigate("/clientes")}
        sx={{
          backgroundColor: "white",
          color: "#1B5C94",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        Clientes
      </Button>
      <Button
        variant="contained"
        onClick={() => navigate("/reportes")}
        sx={{
          backgroundColor: "white",
          color: "#1B5C94",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        Reportes
      </Button>
    </Box>
  );
};

export default Navbar;