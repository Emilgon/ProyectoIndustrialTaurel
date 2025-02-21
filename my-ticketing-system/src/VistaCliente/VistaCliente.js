import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Drawer, List, ListItem, ListItemText, Box, Typography, Button, Paper, Toolbar } from "@mui/material";

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
          consulta.respuestas = respuestasArray;  // Añadir las respuestas a la consulta
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
          [`& .MuiDrawer-paper`]: { width: drawerWidth, backgroundColor: "#1B5C94", color: "white" },
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

      <Box component="main" sx={{ flexGrow: 1, p: 3, display: "flex", justifyContent: "space-between" }}>
        <Paper sx={{ width: "48%", padding: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="h5" fontWeight="bold">Datos del Cliente</Typography>
          <Typography><strong>Nombre:</strong> {userData.name}</Typography>
          <Typography><strong>Dirección:</strong> {userData.address}</Typography>
          <Typography><strong>Empresa:</strong> {userData.company}</Typography>
          <Typography><strong>Rol en la empresa:</strong> {userData.company_role}</Typography>
          <Typography><strong>Correo electrónico:</strong> {userData.email}</Typography>
          <Typography><strong>Teléfono:</strong> {userData.phone}</Typography>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#4CAF50', color: '#fff', marginTop: 2 }}
            onClick={() => navigate('/consulta')}
          >
            Hacer Consulta
          </Button>
        </Paper>

        {showHistorial && (
          <Paper sx={{ width: "48%", padding: 2 }}>
            <Typography variant="h6" fontWeight="bold">Historial de Consultas y Respuestas</Typography>
            {respuestas.length > 0 ? (
              // Ordenar las consultas por fecha de envío (de más reciente a más antigua)
              respuestas
                .slice() // Crear una copia del array para no mutar el original
                .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds) // Ordenar por timestamp
                .map((consulta) => (
                  <Box key={consulta.id} sx={{ borderBottom: "1px solid gray", py: 1 }}>
                    <Typography><strong>Consulta:</strong> {consulta.messageContent}</Typography>
                    {/* Validar el timestamp antes de formatearlo */}
                    {consulta.timestamp?.seconds ? (
                      <Typography><strong>Fecha de Envío:</strong> {new Date(consulta.timestamp.seconds * 1000).toLocaleString()}</Typography>
                    ) : (
                      <Typography><strong>Fecha de Envío:</strong> No disponible</Typography>
                    )}

                    {/* Mostrar archivo adjunto de la consulta */}
                    {consulta.attachment && (
                      <Box marginTop={2}>
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

                    <Typography><strong>Respuestas:</strong></Typography>
                    {consulta.respuestas && consulta.respuestas.length > 0 ? (
                      // Ordenar las respuestas por fecha (de más reciente a más antigua)
                      consulta.respuestas
                        .slice() // Crear una copia del array para no mutar el original
                        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds) // Ordenar por timestamp
                        .map((respuesta) => (
                          <Box key={respuesta.id} sx={{ borderBottom: "1px solid lightgray", py: 1 }}>
                            <Typography><strong>Respuesta:</strong> {respuesta.reply}</Typography>
                            {/* Validar el timestamp antes de formatearlo */}
                            {respuesta.timestamp?.seconds ? (
                              <Typography><strong>Fecha:</strong> {new Date(respuesta.timestamp.seconds * 1000).toLocaleString()}</Typography>
                            ) : (
                              <Typography><strong>Fecha:</strong> No disponible</Typography>
                            )}

                            {/* Mostrar archivo adjunto de la respuesta */}
                            {respuesta.attachment ? (
                              <Box marginTop={2}>
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
                              <Typography><strong>Archivo Adjunto:</strong> No hay archivo adjunto</Typography>
                            )}
                          </Box>
                        ))
                    ) : (
                      <Typography>No hay respuestas para esta consulta.</Typography>
                    )}
                  </Box>
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
