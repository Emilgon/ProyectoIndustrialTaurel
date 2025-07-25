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
  const [userData, setUserData] = useState({
    companyAddress: "Cargando...",
    companyName: "Cargando...",
    company_role: "Cargando...",
    email: "Cargando...",
    name: "Cargando...",
    companyPhone: "Cargando...",
    uid: ""
  });
  const [respuestas, setRespuestas] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const [newResponsesCount, setNewResponsesCount] = useState({});
  const navigate = useNavigate();
  const storage = getStorage();

  // Función mejorada para obtener datos del usuario
  const fetchUserData = async (user) => {
    try {
      console.log("Buscando datos para usuario:", user.uid);
      
      // Primero intentamos obtener por UID directo
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        console.log("Documento encontrado por UID");
        const data = userDocSnap.data();
        updateUserData(data, user);
        return;
      }
      
      // Si no existe por UID, buscamos por email
      console.log("Buscando por email...");
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", user.email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log("Documento encontrado por email");
        const doc = querySnapshot.docs[0];
        updateUserData(doc.data(), user);
      } else {
        console.warn("No se encontró documento para el usuario");
        setUserData({
          companyAddress: "Complete su registro",
          companyName: "Complete su registro",
          company_role: "Complete su registro",
          email: user.email,
          name: "Complete su registro",
          companyPhone: "Complete su registro",
          uid: user.uid
        });
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos del usuario'
      });
    }
  };

  // Función auxiliar para actualizar los datos del usuario
  const updateUserData = (firestoreData, authUser) => {
    console.log("Datos crudos de Firestore:", firestoreData);
    
    setUserData({
      companyAddress: firestoreData.companyAddress || firestoreData.direccion || "No especificado",
      companyName: firestoreData.companyName || firestoreData.empresa || "No especificado",
      company_role: firestoreData.company_role || firestoreData.rol || "No especificado",
      email: firestoreData.email || authUser.email,
      name: firestoreData.name || firestoreData.nombre || "No especificado",
      companyPhone: firestoreData.companyPhone || firestoreData.telefono || "No especificado",
      uid: authUser.uid
    });
  };

  const fetchRespuestas = async (user) => {
    try {
      const consultsRef = query(
        collection(db, "consults"),
        where("email", "==", user.email)
      );
      const consultsSnapshot = await getDocs(consultsRef);
      
      const consultasArray = await Promise.all(
        consultsSnapshot.docs.map(async (doc) => {
          const consulta = { id: doc.id, ...doc.data() };
          
          // Obtener respuestas para esta consulta
          const respuestasRef = query(
            collection(db, "responsesClients"),
            where("consultaId", "==", consulta.id)
          );
          const respuestasSnapshot = await getDocs(respuestasRef);
          consulta.respuestas = respuestasSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          
          return consulta;
        })
      );
      
      setRespuestas(consultasArray);
    } catch (error) {
      console.error("Error al obtener consultas:", error);
    }
  };

  // Listener para nuevas respuestas del asesor
  useEffect(() => {
    const unsubscribeResponses = onSnapshot(
      collection(db, "responses"),
      async (snapshot) => {
        const newCounts = { ...newResponsesCount };
        let hasChanges = false;

        for (const change of snapshot.docChanges()) {
          if (change.type === "added" || change.type === "modified") {
            const newResponse = change.doc.data();
            try {
              const consultaRef = doc(db, "consults", newResponse.consultaId);
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
    const loadInitialNotifications = async (user) => {
      if (!user) return;

      const counts = {};

      // Obtener todas las consultas del usuario
      const consultsRef = query(
        collection(db, "consults"),
        where("email", "==", user.email)
      );
      const consultsSnapshot = await getDocs(consultsRef);

      // Para cada consulta, verificar respuestas no vistas
      for (const consultaDoc of consultsSnapshot.docs) {
        const consultaData = consultaDoc.data();
        const lastViewed = consultaData.lastViewed?.toDate?.();

        // Obtener respuestas de esta consulta
        const respuestasRef = query(
          collection(db, "responses"),
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

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Usuario autenticado:", user);
        fetchUserData(user);
        fetchRespuestas(user);
        loadInitialNotifications(user);
      } else {
        navigate("/menu");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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
      if (fileName.startsWith('gs://')) {
        const path = fileName.split('/').slice(3).join('/');
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        return { url, displayName: path.split('/').pop() };
      }
      
      if (fileName.includes('firebasestorage.googleapis.com')) {
        const urlObj = new URL(fileName);
        const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        return { url, displayName: path.split('/').pop() };
      }

      console.warn(`Formato de archivo no soportado o ruta incompleta: ${fileName}`);
      return null;
    } catch (error) {
      console.error("Error al obtener la URL de descarga:", error);
      return null;
    }
  };

  const fetchAllUrls = async () => {
    const newUrls = {};
    
    for (const consulta of respuestas) {
      if (consulta.attachment && (typeof consulta.attachment === 'string' || Array.isArray(consulta.attachment))) {
        const attachments = Array.isArray(consulta.attachment) 
          ? consulta.attachment 
          : consulta.attachment.split(',').map(f => f.trim()).filter(f => f);
        
        for (const fileName of attachments) {
          if (fileName && !fileUrls[fileName]) {
            const fileInfo = await fetchDownloadUrl(consulta.id, fileName);
            if (fileInfo && fileInfo.url) {
              newUrls[fileName] = fileInfo;
            } else {
              newUrls[fileName] = { displayName: fileName, url: null, error: "Formato no soportado" };
            }
          }
        }
      }

      if (consulta.respuestas) {
        for (const respuesta of consulta.respuestas) {
          if (respuesta.attachment && (typeof respuesta.attachment === 'string' || Array.isArray(respuesta.attachment))) {
            const attachments = Array.isArray(respuesta.attachment) 
              ? respuesta.attachment 
              : respuesta.attachment.split(',').map(f => f.trim()).filter(f => f);
            
            for (const fileName of attachments) {
              if (fileName && !fileUrls[fileName]) {
                const fileInfoResult = await fetchDownloadUrl(consulta.id, fileName);
                if (fileInfoResult && fileInfoResult.url) {
                  newUrls[fileName] = fileInfoResult;
                } else {
                  newUrls[fileName] = { displayName: fileName, url: null, error: "Formato no soportado" };
                }
              }
            }
          }
        }
      }
    }

    if (Object.keys(newUrls).length > 0) {
      setFileUrls(prev => ({ ...prev, ...newUrls }));
    }
  };

  useEffect(() => {
    if (respuestas.length > 0) {
      fetchAllUrls();
    }
  }, [respuestas]);

  useEffect(() => {
    console.log("Datos actuales del usuario:", userData);
  }, [userData]);

  const handleVerRespuestas = async (consultaId) => {
    try {
      const consultaRef = doc(db, "consults", consultaId);
      await updateDoc(consultaRef, {
        lastViewed: new Date()
      });

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
                  <strong>Empresa:</strong> {userData.companyName}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <WorkIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Rol en la empresa:</strong> {userData.company_role}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PersonIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Nombre:</strong> {userData.name}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <LocationOnIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Dirección:</strong> {userData.companyAddress}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <EmailIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Correo electrónico:</strong> {userData.email}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PhoneIcon sx={{ color: "#1B5C94", mr: 2 }} />
                <Typography>
                  <strong>Teléfono:</strong> {userData.companyPhone}
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
            Historial de Consultas
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
                          {(Array.isArray(consulta.attachment) 
                            ? consulta.attachment 
                            : consulta.attachment.split(',').map(f => f.trim())
                          ).map((file) => {
                            const fileInfo = fileUrls[file];
                            if (!fileInfo) return (
                              <ListItem key={file}>
                                <ListItemIcon>
                                  <InsertDriveFileIcon />
                                </ListItemIcon>
                                <ListItemText primary={`Cargando ${file}...`} />
                              </ListItem>
                            );

                            return (
                              <ListItem key={file}>
                                <ListItemIcon>
                                  {getFileIcon(fileInfo.displayName)}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={fileInfo.displayName} 
                                  secondary={fileInfo.url ? "" : "Error al cargar archivo"} 
                                />
                                {fileInfo.url && (
                                  <IconButton
                                    component="a"
                                    href={fileInfo.url}
                                    download={fileInfo.displayName}
                                    target="_blank"
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