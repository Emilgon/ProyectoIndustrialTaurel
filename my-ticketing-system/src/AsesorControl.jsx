import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const AsesorControl = () => {
  const navigate = useNavigate();
  const [consultCount, setConsultCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultCount = async () => {
      try {
        const db = getFirestore();
        const consultsRef = collection(db, "Consults");
        const consultsSnapshot = await getDocs(consultsRef);
        setConsultCount(consultsSnapshot.size);
      } catch (error) {
        console.error("Error fetching consult count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultCount();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "white",
        p: 4,
      }}
    >
      {/* Contador de consultas centrado y más arriba */}
      <Box 
        sx={{ 
          mb: 6, 
          textAlign: "center",
          marginTop: '-80px' // Esto sube el contador más arriba
        }}
      >
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ 
            color: "#1B5C94", 
            fontWeight: 'bold',
            mb: 1
          }}
        >
          Consultas activas
        </Typography>
        <Typography 
          variant="h2" 
          component="div" 
          sx={{ 
            color: "#1B5C94", 
            fontWeight: 'bold',
            fontSize: '3.5rem'
          }}
        >
          {loading ? "..." : consultCount}
        </Typography>
      </Box>

      {/* Paneles rectangulares más anchos que altos */}
      <Box
        sx={{
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: 1200,
        }}
      >
        {/* Botón para Consultas */}
        <Button
          sx={{
            width: 380,
            height: 250,
            borderRadius: 2,
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
          onClick={() => navigate("/vista-asesor-formulario")}
        >
          <QuestionAnswerIcon sx={{ fontSize: 60, color: "white", mb: 2 }} />
          <Typography variant="h4" component="h2" sx={{ color: "white", mb: 1, textTransform: 'none' }}>
            Consultas
          </Typography>
          <Typography variant="body1" sx={{ color: "white", textAlign: "center" }}>
            Gestiona y responde a las consultas de tus clientes
          </Typography>
        </Button>

        {/* Botón para Clientes */}
        <Button
          sx={{
            width: 380,
            height: 250,
            borderRadius: 2,
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
          <PeopleIcon sx={{ fontSize: 60, color: "white", mb: 2 }} />
          <Typography variant="h4" component="h2" sx={{ color: "white", mb: 1, textTransform: 'none' }}>
            Clientes
          </Typography>
          <Typography variant="body1" sx={{ color: "white", textAlign: "center" }}>
            Administra la información de tus clientes
          </Typography>
        </Button>

        {/* Botón para Reportes */}
        <Button
          sx={{
            width: 380,
            height: 250,
            borderRadius: 2,
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
          <AssessmentIcon sx={{ fontSize: 60, color: "white", mb: 2 }} />
          <Typography variant="h4" component="h2" sx={{ color: "white", mb: 1, textTransform: 'none' }}>
            Reportes
          </Typography>
          <Typography variant="body1" sx={{ color: "white", textAlign: "center" }}>
            Genera reportes de tu actividad y desempeño
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default AsesorControl;