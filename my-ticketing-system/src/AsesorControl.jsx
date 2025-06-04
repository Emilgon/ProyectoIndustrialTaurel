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
        justifyContent: "flex-start", // Cambiado para mejor uso del espacio
        alignItems: "center",
        minHeight: "100vh",
        background: "white",
        p: 4,
        pt: 6, 
      }}
    >
      {/* Contador de consultas más grande y prominente */}
      <Box 
        sx={{ 
          textAlign: "center",
          width: "100%",
          maxWidth: 1200,
          mb: 15,
          mt: 10, // Espacio entre el contador y los botones
        }}
      >
        <Typography 
          variant="h2" // Tamaño aumentado
          component="h2" 
          sx={{ 
            color: "#1B5C94", 
            fontWeight: 'bold',
            mb: 2
          }}
        >
          Consultas activas
        </Typography>
        <Typography 
          variant="h1" // Tamaño aumentado
          component="div" 
          sx={{ 
            color: "#1B5C94", 
            fontWeight: 'bold',
            fontSize: '5rem', // Tamaño aumentado
            lineHeight: 1
          }}
        >
          {loading ? "..." : consultCount}
        </Typography>
      </Box>

      {/* Paneles más grandes y con mejor distribución */}
      <Box
        sx={{
          display: "flex",
          gap: 6, // Espacio aumentado entre botones
          justifyContent: "center",
          width: "100%",
          maxWidth: 1400, // Ancho máximo aumentado
          flexWrap: "wrap", // Permite ajuste en pantallas pequeñas
        }}
      >
        {/* Botón para Consultas - tamaño aumentado */}
        <Button
          sx={{
            width: 420, // Ancho aumentado
            height: 300, // Altura aumentada
            borderRadius: 3, // Bordes más redondeados
            boxShadow: 4, // Sombra más pronunciada
            backgroundColor: "#1B5C94",
            "&:hover": {
              backgroundColor: "#f0f0f0",
              boxShadow: 8,
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
            p: 4, // Padding aumentado
            textTransform: 'none',
            transition: 'all 0.3s ease', // Transición suave
          }}
          onClick={() => navigate("/vista-asesor-formulario")}
        >
          <QuestionAnswerIcon sx={{ fontSize: 80, color: "white", mb: 3 }} />
          <Typography variant="h3" component="h2" sx={{ color: "white", mb: 2, fontSize: '2rem' }}>
            Consultas
          </Typography>
          <Typography variant="h6" sx={{ color: "white", textAlign: "center", fontSize: '1.1rem' }}>
            Gestiona y responde a las consultas de tus clientes
          </Typography>
        </Button>

        {/* Botón para Clientes - tamaño aumentado */}
        <Button
          sx={{
            width: 420,
            height: 300,
            borderRadius: 3,
            boxShadow: 4,
            backgroundColor: "#1B5C94",
            "&:hover": {
              backgroundColor: "#f0f0f0",
              boxShadow: 8,
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
            p: 4,
            textTransform: 'none',
            transition: 'all 0.3s ease',
          }}
          onClick={() => navigate("/clients-info")}
        >
          <PeopleIcon sx={{ fontSize: 80, color: "white", mb: 3 }} />
          <Typography variant="h3" component="h2" sx={{ color: "white", mb: 2, fontSize: '2rem' }}>
            Clientes
          </Typography>
          <Typography variant="h6" sx={{ color: "white", textAlign: "center", fontSize: '1.1rem' }}>
            Administra la información de tus clientes
          </Typography>
        </Button>

        {/* Botón para Reportes - tamaño aumentado */}
        <Button
          sx={{
            width: 420,
            height: 300,
            borderRadius: 3,
            boxShadow: 4,
            backgroundColor: "#1B5C94",
            "&:hover": {
              backgroundColor: "#f0f0f0",
              boxShadow: 8,
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
            p: 4,
            textTransform: 'none',
            transition: 'all 0.3s ease',
          }}
          onClick={() => navigate("/reportes")}
        >
          <AssessmentIcon sx={{ fontSize: 80, color: "white", mb: 3 }} />
          <Typography variant="h3" component="h2" sx={{ color: "white", mb: 2, fontSize: '2rem' }}>
            Reportes
          </Typography>
          <Typography variant="h6" sx={{ color: "white", textAlign: "center", fontSize: '1.1rem' }}>
            Genera reportes de tu actividad y desempeño
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default AsesorControl;