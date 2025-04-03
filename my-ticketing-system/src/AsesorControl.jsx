import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";

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
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Botón para Consultas */}
        <Button
          sx={{
            width: 300,
            height: 350,
            borderRadius: 4,
            boxShadow: 3,
            backgroundColor: "#1B5C94",
            "&:hover": {
              backgroundColor: "#f0f0f0",
              boxShadow: 6,
              "& .MuiTypography-root": {
                color: "#1B5C94",
              },
              "& .MuiSvgIcon-root": {
                color: "#1B5C94",
              },
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            textTransform: 'none', // Esto evita que el texto se convierta a mayúsculas
          }}
          onClick={() => navigate("/vista-asesor-formulario")}
        >
          <QuestionAnswerIcon sx={{ fontSize: 80, color: "white", mb: 2 }} />
          <Typography variant="h4" component="h2" sx={{ color: "white", mb: 2, textTransform: 'none' }}>
            Consultas
          </Typography>
          <Typography variant="body" sx={{ color: "white", textAlign: "center" }}>
            Gestiona y responde a las consultas de tus clientes de manera eficiente
          </Typography>
        </Button>

        {/* Botón para Clientes */}
        <Button
          sx={{
            width: 300,
            height: 350,
            borderRadius: 4,
            boxShadow: 3,
            backgroundColor: "#1B5C94",
            "&:hover": {
              backgroundColor: "#f0f0f0",
              boxShadow: 6,
              "& .MuiTypography-root": {
                color: "#1B5C94",
              },
              "& .MuiSvgIcon-root": {
                color: "#1B5C94",
              },
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            textTransform: 'none',
          }}
          onClick={() => navigate("/clients-info")}
        >
          <PeopleIcon sx={{ fontSize: 80, color: "white", mb: 2 }} />
          <Typography variant="h4" component="h2" sx={{ color: "white", mb: 2, textTransform: 'none' }}>
            Clientes
          </Typography>
          <Typography variant="body" sx={{ color: "white", textAlign: "center" }}>
            Administra la información de tus clientes y su historial de consultas
          </Typography>
        </Button>

        {/* Botón para Reportes */}
        <Button
          sx={{
            width: 300,
            height: 350,
            borderRadius: 4,
            boxShadow: 3,
            backgroundColor: "#1B5C94",
            "&:hover": {
              backgroundColor: "#f0f0f0",
              boxShadow: 6,
              "& .MuiTypography-root": {
                color: "#1B5C94",
              },
              "& .MuiSvgIcon-root": {
                color: "#1B5C94",
              },
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            textTransform: 'none',
          }}
          onClick={() => navigate("/reportes")}
        >
          <AssessmentIcon sx={{ fontSize: 80, color: "white", mb: 2 }} />
          <Typography variant="h4" component="h2" sx={{ color: "white", mb: 2, textTransform: 'none' }}>
            Reportes
          </Typography>
          <Typography variant="body" sx={{ color: "white", textAlign: "center" }}>
            Genera reportes detallados de tu actividad y desempeño como asesor
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default AsesorControl;