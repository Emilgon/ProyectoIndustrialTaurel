import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  Button,
  Paper,
  Toolbar,
  Card,
  CardContent,
  Divider,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import ReplyIcon from "@mui/icons-material/Reply";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";

const drawerWidth = 240;

const VistaCliente = () => {
  const [userData, setUserData] = useState({});
  const [respuestas, setRespuestas] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userRef = collection(db, "Clients");
          const querySnapshot = await getDocs(userRef);
          querySnapshot.forEach((doc) => {
            if (doc.data().email.toLowerCase() === user.email.toLowerCase()) {
              setUserData({ ...doc.data(), uid: user.uid });
            }
          });
        }
      });
    };

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

    fetchUserData();
    fetchRespuestas();
  }, []);

  const handleSalir = () => {
    navigate("/login");
  };

  const toggleHistorial = () => {
    setShowHistorial(!showHistorial);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            backgroundColor: "#1B5C94",
            color: "white",
          },
        }}
      >
        <Toolbar />
        <List>
          <ListItem button onClick={toggleHistorial}>
            <ListItemText primary="Historial" />
          </ListItem>
          <ListItem button onClick={handleSalir}>
            <ListItemText primary="Salir" />
          </ListItem>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, display: "flex", justifyContent: "space-between" }}
      >
        {/* Sección de Datos del Cliente */}
        <Card sx={{ width: "48%", boxShadow: 3 }}>
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
        {showHistorial && (
          <Paper sx={{ width: "48%", padding: 2 }}>
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
                      <Typography sx={{ mb: 2 }}>
                        <strong>Mensaje:</strong> {consulta.messageContent}
                      </Typography>
                      {consulta.timestamp?.seconds ? (
                        <Typography sx={{ mb: 2 }}>
                          <strong>Fecha de Envío:</strong>{" "}
                          {new Date(consulta.timestamp.seconds * 1000).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography sx={{ mb: 2 }}>
                          <strong>Fecha de Envío:</strong> No disponible
                        </Typography>
                      )}
                      {consulta.attachment && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h6">
                            <strong>Archivo Adjunto:</strong>
                          </Typography>
                          <Box display="flex" alignItems="center">
                            {consulta.attachment
                              .split(", ")
                              .map((fileName) => (
                                <Box key={fileName} marginRight={2}>
                                  <a
                                    href={`path_to_your_storage/${fileName}`}
                                    download
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={`path_to_your_storage/${fileName}`}
                                      alt={fileName}
                                      className="file-thumbnail"
                                    />
                                  </a>
                                </Box>
                              ))}
                          </Box>
                        </Box>
                      )}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Respuestas
                      </Typography>
                      {consulta.respuestas && consulta.respuestas.length > 0 ? (
                        consulta.respuestas
                          .slice()
                          .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
                          .map((respuesta) => (
                            <Box key={respuesta.id} sx={{ mb: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Avatar sx={{ bgcolor: "#4CAF50", mr: 2 }}>
                                  <ReplyIcon />
                                </Avatar>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  Respuesta
                                </Typography>
                              </Box>
                              <Typography sx={{ mb: 1 }}>
                                <strong>Mensaje:</strong> {respuesta.reply}
                              </Typography>
                              {respuesta.timestamp?.seconds ? (
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Fecha:</strong>{" "}
                                  {new Date(respuesta.timestamp.seconds * 1000).toLocaleString()}
                                </Typography>
                              ) : (
                                <Typography sx={{ mb: 1 }}>
                                  <strong>Fecha:</strong> No disponible
                                </Typography>
                              )}
                              {respuesta.attachment ? (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="h6">
                                    <strong>Archivo Adjunto:</strong>
                                  </Typography>
                                  <Box display="flex" alignItems="center">
                                    {respuesta.attachment
                                      .split(", ")
                                      .map((fileName) => (
                                        <Box key={fileName} marginRight={2}>
                                          <a
                                            href={`path_to_your_storage/${fileName}`}
                                            download
                                            rel="noopener noreferrer"
                                          >
                                            <img
                                              src={`path_to_your_storage/${fileName}`}
                                              alt={fileName}
                                              className="file-thumbnail"
                                            />
                                          </a>
                                        </Box>
                                      ))}
                                  </Box>
                                </Box>
                              ) : (
                                <Typography sx={{ mb: 2 }}>
                                  <strong>Archivo Adjunto:</strong> No hay archivo adjunto
                                </Typography>
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
        )}
      </Box>
    </Box>
  );
};

export default VistaCliente;