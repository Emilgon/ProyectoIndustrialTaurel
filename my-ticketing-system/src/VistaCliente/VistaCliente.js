import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import ReplyIcon from "@mui/icons-material/Reply";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import HistoryIcon from "@mui/icons-material/History";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"; // Ícono para PDF
import ImageIcon from "@mui/icons-material/Image"; // Ícono para imágenes
import DescriptionIcon from "@mui/icons-material/Description"; // Ícono para documentos
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile"; // Ícono para archivos genéricos
import GetAppIcon from "@mui/icons-material/GetApp"; // Ícono de descarga
import TableChartIcon from "@mui/icons-material/TableChart"; // Ícono para archivos Excel

const VistaCliente = () => {
  const [userData, setUserData] = useState({});
  const [respuestas, setRespuestas] = useState([]);
  const [fileUrls, setFileUrls] = useState({}); // Estado para almacenar las URLs de descarga
  const navigate = useNavigate();
  const storage = getStorage(); // Inicializar Firebase Storage

  // Función para obtener los datos del usuario
  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      const userRef = collection(db, "Clients");
      const q = query(userRef, where("email", "==", user.email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setUserData({ ...doc.data(), uid: user.uid });
      }
    }
  };

  // Función para obtener las respuestas
  const fetchRespuestas = async () => {
    const user = auth.currentUser;
    if (user) {
      // Obtener todas las consultas del cliente
      const consultsRef = query(
        collection(db, "Consults"),
        where("email", "==", user.email)
      );
      const consultsSnapshot = await getDocs(consultsRef);
      const consultasArray = consultsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Obtener las respuestas para cada consulta
      for (let consulta of consultasArray) {
        const respuestasRef = query(
          collection(db, "Responses"),
          where("consultaId", "==", consulta.id)
        );
        const respuestasSnapshot = await getDocs(respuestasRef);
        const respuestasArray = respuestasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        consulta.respuestas = respuestasArray; // Añadir las respuestas a la consulta
      }

      // Guardar todas las consultas con sus respuestas
      setRespuestas(consultasArray);
    }
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
      case "xls":
      case "xlsx":
        return <TableChartIcon />;
      default:
        return <InsertDriveFileIcon />;
    }
  };

  // Función para obtener la URL de descarga de un archivo
  const fetchDownloadUrl = async (consultaId, fileName) => {
    try {
      const storageRef = ref(storage, `respuestas/${consultaId}/${fileName}`); // Cambiada la ruta para que coincida con Respuesta.js
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
      for (const consulta of respuestas) {
        if (consulta.attachment) {
          for (const fileName of consulta.attachment.split(", ")) {
            if (!fileUrls[fileName]) {
              const url = await fetchDownloadUrl(consulta.id, fileName);
              if (url) {
                urls[fileName] = url;
              }
            }
          }
        }
        if (consulta.respuestas) {
          for (const respuesta of consulta.respuestas) {
            if (respuesta.attachment) { // Cambiado de attachmentReply a attachment
              for (const fileName of respuesta.attachment.split(", ")) {
                if (!fileUrls[fileName]) {
                  const url = await fetchDownloadUrl(consulta.id, fileName);
                  if (url) {
                    urls[fileName] = url;
                  }
                }
              }
            }
          }
        }
      }
      setFileUrls((prevUrls) => ({ ...prevUrls, ...urls }));
    };

    if (respuestas.length > 0) {
      fetchAllUrls();
    }
  }, [respuestas]);

  // Ejecutar fetchUserData y fetchRespuestas al cargar el componente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData();
        fetchRespuestas();
      } else {
        navigate("/menu");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSalir = () => {
    navigate("/menu");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Contenido principal */}
      <Box sx={{ display: "flex", flexGrow: 1, p: 3, gap: 2 }}>
        {/* Sección de Datos del Cliente */}
        <Card sx={{ height: "fit-content", boxShadow: 3, flex: 1 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Avatar sx={{ bgcolor: "#1B5C94", mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                Datos del Cliente
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <BusinessIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Empresa:</strong> {userData.company || "No disponible"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <WorkIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Rol en la empresa:</strong> {userData.company_role || "No disponible"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PersonIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Nombre:</strong> {userData.name || "No disponible"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <LocationOnIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Dirección:</strong> {userData.address || "No disponible"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <EmailIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Correo electrónico:</strong> {userData.email || "No disponible"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PhoneIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Teléfono:</strong> {userData.phone || "No disponible"}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              sx={{ backgroundColor: "#4CAF50", color: "#fff", width: "100%" }}
              onClick={() => navigate("/consulta")}
            >
              Hacer Consulta
            </Button>
          </CardContent>
        </Card>

        {/* Sección de Historial */}
        <Paper sx={{ flex: 2, padding: 2, overflowY: "auto" }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Historial de Consultas y Respuestas
          </Typography>
          {respuestas.length > 0 ? (
            respuestas
              .slice()
              .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
              .map((consulta) => (
                <Card key={consulta.id} sx={{ mb: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: "#1B5C94", mr: 2 }}>
                        <ChatIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold">
                        Consulta
                      </Typography>
                    </Box>
                    <Typography sx={{ mb: 2, textAlign: 'left' }}>
                      <strong>Asunto:</strong> {consulta.affair || "No disponible"}
                    </Typography>
                    <Typography sx={{ mb: 2, textAlign: 'left' }}>
                      <strong>Mensaje:</strong> {consulta.messageContent}
                    </Typography>
                    {consulta.timestamp?.seconds ? (
                      <Typography sx={{ mb: 2, textAlign: 'left' }}>
                        <strong>Fecha de Envío:</strong>{" "}
                        {new Date(consulta.timestamp.seconds * 1000).toLocaleString()}
                      </Typography>
                    ) : (
                      <Typography sx={{ mb: 2, textAlign: 'left' }}>
                        <strong>Fecha de Envío:</strong> No disponible
                      </Typography>
                    )}
                    {consulta.attachment && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ textAlign: 'left' }}>
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
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, textAlign: 'left' }}>
                      Respuestas
                    </Typography>
                    {consulta.respuestas && consulta.respuestas.length > 0 ? (
                      consulta.respuestas
                        .slice()
                        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
                        .map((respuesta) => (
                          <Box key={respuesta.id} sx={{ mb: 2, textAlign: 'left' }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                              <Avatar sx={{ bgcolor: "#4CAF50", mr: 2 }}>
                                <ReplyIcon />
                              </Avatar>
                              <Typography variant="subtitle1" fontWeight="bold" sx={{ textAlign: 'left' }}>
                                Respuesta
                              </Typography>
                            </Box>
                            <Typography sx={{ mb: 1, textAlign: 'left' }}>
                              <strong>Mensaje:</strong> {respuesta.content}
                            </Typography>
                            {respuesta.timestamp?.seconds ? (
                              <Typography sx={{ mb: 1, textAlign: 'left' }}>
                                <strong>Fecha:</strong>{" "}
                                {new Date(respuesta.timestamp.seconds * 1000).toLocaleString()}
                              </Typography>
                            ) : (
                              <Typography sx={{ mb: 1, textAlign: 'left' }}>
                                <strong>Fecha:</strong> No disponible
                              </Typography>
                            )}

                            {/* Mostrar el archivo adjunto de la respuesta */}
                            {respuesta.attachment && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ textAlign: 'left' }}>
                                  <strong>Archivo Adjunto:</strong>
                                </Typography>
                                <List>
                                  {respuesta.attachment.split(", ").map((fileName) => {
                                    const fileUrl = fileUrls[fileName];
                                    const isImage = ["jpg", "jpeg", "png", "gif"].includes(
                                      fileName.split(".").pop().toLowerCase()
                                    );
                                    return (
                                      <ListItem key={fileName}>
                                        <ListItemIcon>
                                          {getFileIcon(fileName)}
                                        </ListItemIcon>
                                        <ListItemText primary={fileName} />
                                        {fileUrl && (
                                          <IconButton
                                            component="a"
                                            href={fileUrl}
                                            download
                                            rel="noopener noreferrer"
                                          >
                                            <GetAppIcon />
                                          </IconButton>
                                        )}
                                      </ListItem>
                                    );
                                  })}
                                </List>
                              </Box>
                            )}

                            <Divider sx={{ my: 2 }} />
                          </Box>
                        ))
                    ) : (
                      <Typography>No hay respuestas para esta consulta.</Typography>
                    )}
                  </CardContent>
                </Card>
              ))
          ) : (
            <Typography>No hay consultas disponibles.</Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default VistaCliente;
