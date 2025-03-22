import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"; // Icono de administrador

const AsesorControl = () => {
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
        {/* Botón para Consultas */}
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
          onClick={() => navigate("/vista-asesor-formulario")} // Redirige a VistaAsesorFormulario
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 80, color: "white" }} />
          <Typography variant="h4" component="h2" sx={{ mt: 2, color: "white" }}>
            Consultas
          </Typography>
        </Button>

        {/* Botón para Clientes */}
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
          onClick={() => navigate("/clients-info")} // Redirige a ClientsInfo
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 80, color: "white" }} />
          <Typography variant="h4" component="h2" sx={{ mt: 2, color: "white" }}>
            Clientes
          </Typography>
        </Button>

        {/* Botón para Reportes */}
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
          onClick={() => navigate("/reportes")} // Redirige a Reportes
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 80, color: "white" }} />
          <Typography variant="h4" component="h2" sx={{ mt: 2, color: "white" }}>
            Reportes
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default AsesorControl;