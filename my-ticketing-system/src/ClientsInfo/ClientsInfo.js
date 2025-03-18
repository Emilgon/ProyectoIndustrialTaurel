import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Avatar,
  Card,
  CardContent,
  Divider,
  Grid,
} from "@mui/material";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const ClientsInfo = () => {
  const [empresas, setEmpresas] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmpresas = async () => {
      const querySnapshot = await getDocs(collection(db, "Clients"));
      const empresasData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmpresas(empresasData);
    };
    fetchEmpresas();
  }, []);

  const handleToggleDetails = async (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
      setConsultas([]);
      return;
    }

    const consultasRef = query(
      collection(db, "Consults"),
      where("clientId", "==", id),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const consultasSnapshot = await getDocs(consultasRef);
    const consultasData = consultasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Consultas encontradas:", consultasData); // Depuración
    setConsultas(consultasData);
    setExpandedRow(id);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp || !timestamp.seconds) {
      return "Fecha no disponible";
    }
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Empresas Registradas
      </Typography>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/menu")}
        sx={{
          marginBottom: 2,
          borderColor: "red",
          color: "red",
          borderRadius: "20px",
          "&:hover": { borderColor: "#145a8c", backgroundColor: "#f5f5f5" },
        }}
      >
        Volver
      </Button>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#1B5C94" }}>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Empresa</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Contacto</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Correo</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Última Consulta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empresas.map((empresa) => (
              <React.Fragment key={empresa.id}>
                <TableRow
                  onClick={() => handleToggleDetails(empresa.id)}
                  sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f5f5f5" } }}
                >
                  <TableCell>{empresa.company}</TableCell>
                  <TableCell>{empresa.name}</TableCell>
                  <TableCell>{empresa.email}</TableCell>
                  <TableCell>
                    {empresa.lastConsultDate ? formatDateTime(empresa.lastConsultDate) : "No disponible"}
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                  {expandedRow === empresa.id && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ p: 0 }}>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <Card sx={{ m: 2, boxShadow: 3, borderRadius: 2 }}>
                            <CardContent>
                              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#1B5C94" }}>
                                Detalles de la Empresa
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1 }}>
                                      <PersonIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography fontWeight="bold">Contacto</Typography>
                                      <Typography>{empresa.name || "No disponible"}</Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1 }}>
                                      <BusinessIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography fontWeight="bold">Empresa</Typography>
                                      <Typography>{empresa.company || "No disponible"}</Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1 }}>
                                      <EmailIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography fontWeight="bold">Correo</Typography>
                                      <Typography>{empresa.email || "No disponible"}</Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1 }}>
                                      <CalendarTodayIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography fontWeight="bold">Última Consulta</Typography>
                                      <Typography>
                                        {empresa.lastConsultDate ? formatDateTime(empresa.lastConsultDate) : "No disponible"}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Últimas 5 Consultas
                              </Typography>
                              {consultas.length > 0 ? (
                                consultas.map((consulta) => (
                                  <Box key={consulta.id} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                                    <Typography><strong>Consulta:</strong> {consulta.messageContent}</Typography>
                                    <Typography sx={{ color: "text.secondary" }}>
                                      Fecha: {formatDateTime(consulta.timestamp)}
                                    </Typography>
                                  </Box>
                                ))
                              ) : (
                                <Typography>No hay consultas recientes.</Typography>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClientsInfo;