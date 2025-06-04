import React from "react";
import { useNavigate } from "react-router-dom";
import LoginRegisterClient from "../LoginRegisterClient/LoginRegisterClient";
import { Box, Typography } from "@mui/material";
import "./Menu.css";

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
            width: "40%",
            position: "relative",
            overflow: "hidden",
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
            width: "60%",
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