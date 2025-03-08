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
        background: "white", // Fondo degradado de blanco a #1B5C94
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 4, // Espacio entre los botones
        }}
      >
        <Button
          sx={{
            width: 300, // Ancho del botón
            height: 300, // Alto del botón
            borderRadius: 4, // Bordes redondeados
            boxShadow: 3, // Sombra
            backgroundColor: "#1B5C94", // Fondo blanco
            "&:hover": {
              backgroundColor: "#f0f0f0", // Color de fondo al pasar el mouse
              boxShadow: 6, // Sombra más pronunciada al pasar el mouse
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => navigate("/login")} // Redirige al login de cliente
        >
          <PersonIcon sx={{ fontSize: 80, color: "white" }} /> {/* Ícono grande */}
          <Typography variant="h4" component="h2" sx={{ mt: 2, color: "white" }}>
            Cliente
          </Typography>
        </Button>

        <Button
          sx={{
            width: 300, // Ancho del botón
            height: 300, // Alto del botón
            borderRadius: 4, // Bordes redondeados
            boxShadow: 3, // Sombra
            backgroundColor: "#1B5C94", // Fondo blanco
            "&:hover": {
              backgroundColor: "#f0f0f0", // Color de fondo al pasar el mouse
              boxShadow: 6, // Sombra más pronunciada al pasar el mouse
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => navigate("/login-asesor")} // Redirige al login de asesor
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 80, color: "white" }} /> {/* Ícono grande */}
          <Typography variant="h4" component="h2" sx={{ mt: 2, color: "white" }}>
            Asesor
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default Menu;