import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import HistoryIcon from "@mui/icons-material/History";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import TableChartIcon from "@mui/icons-material/TableChart";
import GetAppIcon from "@mui/icons-material/GetApp";
import NotificationsIcon from '@mui/icons-material/Notifications';
import Swal from "sweetalert2";

const VistaCliente = () => {
  const [userData, setUserData] = useState({});
  const [respuestas, setRespuestas] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const [newResponsesCount, setNewResponsesCount] = useState({});
  const navigate = useNavigate();
  const storage = getStorage();

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

  const fetchRespuestas = async () => {
    const user = auth.currentUser;
    if (user) {
      const consultsRef = query(
        collection(db, "Consults"),
        where("email", "==", user.email)
      );
      const consultsSnapshot = await getDocs(consultsRef);
      const consultasArray = consultsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

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
        consulta.respuestas = respuestasArray;
      }

      setRespuestas(consultasArray);
    }
  };

  // Listener para nuevas respuestas del asesor
  useEffect(() => {
    const unsubscribeResponses = onSnapshot(
      collection(db, "Responses"),
      async (snapshot) => {
        const newCounts = { ...newResponsesCount };
        let hasChanges = false;

        for (const change of snapshot.docChanges()) {
          if (change.type === "added" || change.type === "modified") {
            const newResponse = change.doc.data();
            try {
              const consultaRef = doc(db, "Consults", newResponse.consultaId);
              const consultaDoc = await getDoc(consultaRef);

              if (consultaDoc.exists()) {
                const consultaData = consultaDoc.data();
                const responseDate = newResponse.timestamp?.toDate?.();
                const lastViewedDate = consultaData.lastViewed?.toDate?.();

                if (!lastViewedDate || (responseDate && responseDate > lastViewedDate)) {
                  newCounts[newResponse.consultaId] = (newCounts[newResponse.consultaId] || 0) + 1;
                  hasChanges = true;
                }
              }
            } catch (error) {
              console.error("Error al verificar estado de consulta:", error);
            }
          }
        }

        if (hasChanges) {
          setNewResponsesCount(newCounts);
        }
      }
    );

    return () => unsubscribeResponses();
  }, [newResponsesCount]);

  // Cargar notificaciones existentes al iniciar
  useEffect(() => {
    const loadInitialNotifications = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const counts = {};

      // Obtener todas las consultas del usuario
      const consultsRef = query(
        collection(db, "Consults"),
        where("email", "==", user.email)
      );
      const consultsSnapshot = await getDocs(consultsRef);

      // Para cada consulta, verificar respuestas no vistas
      for (const consultaDoc of consultsSnapshot.docs) {
        const consultaData = consultaDoc.data();
        const lastViewed = consultaData.lastViewed?.toDate?.();

        // Obtener respuestas de esta consulta
        const respuestasRef = query(
          collection(db, "Responses"),
          where("consultaId", "==", consultaDoc.id)
        );
        const respuestasSnapshot = await getDocs(respuestasRef);

        // Contar respuestas no vistas
        let unseenCount = 0;
        respuestasSnapshot.forEach((respuestaDoc) => {
          const respuestaData = respuestaDoc.data();
          const respuestaDate = respuestaData.timestamp?.toDate?.();

          if (!lastViewed || (respuestaDate && respuestaDate > lastViewed)) {
            unseenCount++;
          }
        });

        if (unseenCount > 0) {
          counts[consultaDoc.id] = unseenCount;
        }
      }

      setNewResponsesCount(counts);
    };

    loadInitialNotifications();
  }, []);

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

  const fetchDownloadUrl = async (consultaId, fileName) => {
    try {
      // Si es una URL de Firebase Storage, extraemos solo el nombre del archivo
      if (fileName.includes('firebasestorage.googleapis.com')) {
        // Extraemos el nombre codificado de la URL
        const encodedFileName = fileName.split('%2F').pop().split('?')[0];
        // Decodificamos el nombre (por ejemplo, reemplaza %20 con espacios)
        const decodedFileName = decodeURIComponent(encodedFileName);
        // Usamos el nombre decodificado para crear la referencia
        const storageRef = ref(storage, `${decodedFileName}`);
        const url = await getDownloadURL(storageRef);
        return { url, displayName: decodedFileName };
      }

      // Si no es una URL completa, asumimos que es solo el nombre del archivo
      const storageRef = ref(storage, `${fileName}`);
      const url = await getDownloadURL(storageRef);
      return { url, displayName: fileName };
    } catch (error) {
      console.error("Error al obtener la URL de descarga:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllUrls = async () => {
      const urls = {};
      for (const consulta of respuestas) {
        if (consulta.attachment) {
          for (const fileName of consulta.attachment.split(", ")) {
            if (!fileUrls[fileName]) {
              const fileInfo = await fetchDownloadUrl(consulta.id, fileName);
              if (fileInfo) {
                urls[fileName] = fileInfo;
              }
            }
          }
        }
        if (consulta.respuestas) {
          for (const respuesta of consulta.respuestas) {
            if (respuesta.attachment) {
              for (const fileName of respuesta.attachment.split(", ")) {
                if (!fileUrls[fileName]) {
                  const fileInfo = await fetchDownloadUrl(consulta.id, fileName);
                  if (fileInfo) {
                    urls[fileName] = fileInfo;
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

  const handleVerRespuestas = async (consultaId) => {
    try {
      // Marcar como visto al entrar
      const consultaRef = doc(db, "Consults", consultaId);
      await updateDoc(consultaRef, {
        lastViewed: new Date()
      });

      // Resetear el contador de notificaciones
      setNewResponsesCount(prev => ({
        ...prev,
        [consultaId]: 0
      }));

      navigate(`/vista-cliente/${consultaId}`);
    } catch (error) {
      console.error("Error al actualizar la consulta:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo abrir la consulta. Por favor intenta nuevamente.',
      });
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
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

                      <Box sx={{ position: 'relative', display: 'inline-flex', ml: 2 }}>
                        <Button
                          variant="contained"
                          sx={{
                            backgroundColor: "#1B5C94",
                            color: "#fff",
                            "&:hover": {
                              backgroundColor: "#145a8c",
                            }
                          }}
                          onClick={() => handleVerRespuestas(consulta.id)}
                        >
                          VER RESPUESTAS
                        </Button>
                        {newResponsesCount[consulta.id] > 0 && (
                          <Badge
                            badgeContent={newResponsesCount[consulta.id]}
                            color="error"
                            overlap="circular"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              transform: 'translate(30%, -30%)',
                              '& .MuiBadge-badge': {
                                height: '24px',
                                minWidth: '24px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Typography sx={{ mb: 2, textAlign: "left" }}>
                      <strong>Asunto:</strong> {consulta.affair || "No disponible"}
                    </Typography>
                    <Typography sx={{ mb: 2, textAlign: "left" }}>
                      <strong>Mensaje:</strong> {consulta.messageContent}
                    </Typography>
                    {consulta.timestamp?.seconds ? (
                      <Typography sx={{ mb: 2, textAlign: "left" }}>
                        <strong>Fecha de Envío:</strong>{" "}
                        {new Date(consulta.timestamp.seconds * 1000).toLocaleString()}
                      </Typography>
                    ) : (
                      <Typography sx={{ mb: 2, textAlign: "left" }}>
                        <strong>Fecha de Envío:</strong> No disponible
                      </Typography>
                    )}
                    {consulta.attachment && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ textAlign: "left" }}>
                          <strong>Archivo Adjunto:</strong>
                        </Typography>
                        <List>
                          {consulta.attachment.split(", ").map((file) => {
                            const fileInfo = fileUrls[file];
                            if (!fileInfo) return null;

                            return (
                              <ListItem key={file}>
                                <ListItemIcon>
                                  {getFileIcon(fileInfo.displayName)}
                                </ListItemIcon>
                                <ListItemText primary={fileInfo.displayName} />
                                <IconButton
                                  component="a"
                                  href={fileInfo.url}
                                  download={fileInfo.displayName}
                                  rel="noopener noreferrer"
                                >
                                  <GetAppIcon />
                                </IconButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
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