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
  Link,
  List,
  ListItem,
  ListItemIcon,
  IconButton,
  ListItemText
} from "@mui/material";
import { db, storage } from "../firebaseConfig";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AttachmentIcon from "@mui/icons-material/Attachment";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"; // Ícono para PDF
import ImageIcon from "@mui/icons-material/Image"; // Ícono para imágenes
import DescriptionIcon from "@mui/icons-material/Description"; // Ícono para documentos
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile"; // Ícono para archivos genéricos
import GetAppIcon from "@mui/icons-material/GetApp"; // Ícono de descarga

const ClientsInfo = () => {
  const [empresas, setEmpresas] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [fileUrls, setFileUrls] = useState({}); // Estado para almacenar las URLs de descarga
  const navigate = useNavigate();

  const formatDateTime = (timestamp) => {
    if (!timestamp || !timestamp.seconds) {
      return "Fecha no disponible";
    }
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  // Función para obtener el ícono según el tipo de archivo
  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <PictureAsPdfIcon />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon />;
      case "doc":
      case "docx":
        return <DescriptionIcon />;
      default:
        return <InsertDriveFileIcon />;
    }
  };

  // Función para obtener la URL de descarga de un archivo
  const fetchDownloadUrl = async (fileName) => {
    try {
      const storageRef = ref(storage, `ruta_de_tus_archivos/${fileName}`); // Cambia la ruta según tu estructura
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Error al obtener la URL de descarga:", error);
      return null;
    }
  };

  // Obtener las URLs de descarga para todos los archivos adjuntos
  useEffect(() => {
    const fetchAllUrls = async () => {
      const urls = {};
      for (const consulta of consultas) {
        if (consulta.attachment) {
          for (const fileName of consulta.attachment.split(", ")) {
            if (!fileUrls[fileName]) {
              const url = await fetchDownloadUrl(fileName);
              if (url) {
                urls[fileName] = url;
              }
            }
          }
        }
      }
      setFileUrls((prevUrls) => ({ ...prevUrls, ...urls }));
    };

    if (consultas.length > 0) {
      fetchAllUrls();
    }
  }, [consultas]);

  useEffect(() => {
    const fetchEmpresas = async () => {
      const querySnapshot = await getDocs(collection(db, "Clients"));
      const empresasData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const empresa = { id: doc.id, ...doc.data() };

          // Obtener la última consulta
          const ultimaConsultaRef = query(
            collection(db, "Consults"),
            where("name", "==", empresa.name),
            orderBy("timestamp", "desc"),
            limit(1)
          );
          const ultimaConsultaSnapshot = await getDocs(ultimaConsultaRef);
          const ultimaConsulta = ultimaConsultaSnapshot.docs[0]?.data() || null;

          return {
            ...empresa,
            ultimaConsulta: ultimaConsulta ? formatDateTime(ultimaConsulta.timestamp) : "No disponible",
            ultimaConsultaContent: ultimaConsulta ? ultimaConsulta.messageContent : "No disponible",
            ultimaConsultaAttachment: ultimaConsulta ? ultimaConsulta.attachment : null,
          };
        })
      );
      setEmpresas(empresasData);
    };
    fetchEmpresas();
  }, []);

  const handleToggleDetails = async (index) => {
    if (expandedRow === empresas[index].id) {
      setExpandedRow(null);
      setConsultas([]);
      return;
    }

    const consultasRef = query(
      collection(db, "Consults"),
      where("name", "==", empresas[index].name),
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
    setExpandedRow(empresas[index].id);
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
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nombre de la Última Consulta del Cliente</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empresas.map((empresa, index) => (
              <React.Fragment key={empresa.id}>
                <TableRow
                  onClick={() => handleToggleDetails(index)}
                  sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f5f5f5" } }}
                >
                  <TableCell>{empresa.company}</TableCell>
                  <TableCell>{empresa.name}</TableCell>
                  <TableCell>{empresa.email}</TableCell>
                  <TableCell>
                    {empresa.ultimaConsulta}
                    {empresa.ultimaConsultaAttachment && (
                      <AttachmentIcon fontSize="small" sx={{ ml: 1, verticalAlign: "middle" }} />
                    )}
                  </TableCell>
                  <TableCell>{empresa.ultimaConsultaContent}</TableCell>
                </TableRow>
                <AnimatePresence>
                  {expandedRow === empresa.id && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ p: 0 }}>
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
                                      <Typography>{empresa.ultimaConsulta}</Typography>
                                      <Typography>
                                        <strong>Contenido:</strong> {empresa.ultimaConsultaContent}
                                      </Typography>
                                      {empresa.ultimaConsultaAttachment && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="h6">
                                            <strong>Archivo Adjunto:</strong>
                                          </Typography>
                                          <List>
                                            {empresa.ultimaConsultaAttachment.split(", ").map((fileName) => (
                                              <ListItem key={fileName}>
                                                <ListItemIcon>{getFileIcon(fileName)}</ListItemIcon>
                                                <ListItemText primary={fileName} />
                                                {fileUrls[fileName] && (
                                                  <IconButton
                                                    component="a"
                                                    href={fileUrls[fileName]}
                                                    download
                                                    rel="noopener noreferrer"
                                                  >
                                                    <GetAppIcon />
                                                  </IconButton>
                                                )}
                                              </ListItem>
                                            ))}
                                          </List>
                                        </Box>
                                      )}
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
                                  <Box
                                    key={consulta.id}
                                    sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}
                                  >
                                    <Typography>
                                      <strong>Consulta:</strong> {consulta.messageContent}
                                    </Typography>
                                    <Typography sx={{ color: "text.secondary" }}>
                                      Fecha: {formatDateTime(consulta.timestamp)}
                                    </Typography>
                                    {consulta.attachment && (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="h6">
                                          <strong>Archivo Adjunto:</strong>
                                        </Typography>
                                        <List>
                                          {consulta.attachment.split(", ").map((fileName) => (
                                            <ListItem key={fileName}>
                                              <ListItemIcon>{getFileIcon(fileName)}</ListItemIcon>
                                              <ListItemText primary={fileName} />
                                              {fileUrls[fileName] && (
                                                <IconButton
                                                  component="a"
                                                  href={fileUrls[fileName]}
                                                  download
                                                  rel="noopener noreferrer"
                                                >
                                                  <GetAppIcon />
                                                </IconButton>
                                              )}
                                            </ListItem>
                                          ))}
                                        </List>
                                      </Box>
                                    )}
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