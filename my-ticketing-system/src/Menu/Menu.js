import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person"; // Icono de persona
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"; // Icono de administrador
import "./Menu.css";

const Menu = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "white",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 4,
        }}
      >
        {/* Botón para Cliente */}
        <Button
          sx={{
            width: 300,
            height: 300,
            borderRadius: 4,
            boxShadow: 3,
            backgroundColor: "#1B5C94",
            "&:hover": {
              backgroundColor: "#f0f0f0",
              boxShadow: 6,
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => navigate("/login")} // Redirige al login de cliente
        >
          <PersonIcon sx={{ fontSize: 80, color: "white" }} />
          <Typography variant="h4" component="h2" sx={{ mt: 2, color: "white" }}>
            Cliente
          </Typography>
        </Button>

        {/* Botón para Asesor */}
        <Button
          sx={{
            width: 300,
            height: 300,
            borderRadius: 4,
            boxShadow: 3,
            backgroundColor: "#1B5C94",
            "&:hover": {
              backgroundColor: "#f0f0f0",
              boxShadow: 6,
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => navigate("/login-asesor")} // Redirige al login de asesor
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 80, color: "white" }} />
          <Typography variant="h4" component="h2" sx={{ mt: 2, color: "white" }}>
            Asesor
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default Menu;