import React from "react";
import { useNavigate } from "react-router-dom";
import LoginRegisterClient from "../LoginRegisterClient/LoginRegisterClient";
import { Box, Typography } from "@mui/material";
import "./Menu.css";

/**
 * Componente que representa el menú principal o la página de inicio de sesión.
 * Muestra una imagen de fondo y el componente de inicio de sesión del cliente.
 * @returns {JSX.Element} El elemento JSX que representa el menú principal.
 */
const Menu = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100vh",
      backgroundColor: "white"
    }}>
      <Box sx={{ 
        display: "flex", 
        flexGrow: 1,
        backgroundColor: "white"
      }}>
        {/* Panel izquierdo con imagen de fondo */}
        <Box
          sx={{
            width: { xs: "0%", md: "40%" },
            position: "relative",
            overflow: "hidden",
            display: { xs: "none", md: "block" }
          }}
        >
          <img
            src="/images/imagenlogincliente.png"
            alt="Imagen de login"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>

        {/* Panel derecho con el formulario de login */}
        <Box
          sx={{
            width: { xs: "100%", md: "60%" },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FEFEFE",
          }}
        >
          <LoginRegisterClient
            showAdvisorOption={true}
            onAdvisorClick={() => navigate("/login-asesor")}
            hideBackButton={true}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Menu;
