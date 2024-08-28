import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import { useNavigate } from "react-router-dom";
import {Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Paper,Button,Typography,Box,Select,MenuItem,Grid,Card,CardContent} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChatIcon from "@mui/icons-material/Chat";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import {db,collection,getDocs,updateDoc,doc,addDoc} from "../firebaseConfig";
import "./VistaAsesorFormulario.css";

const VistaAsesorFormulario = () => {
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("empresa");
  const [editType, setEditType] = useState("No asignado");
  const [currentId, setCurrentId] = useState(null);
  const [resolverDays, setResolverDays] = useState(0);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [enProcesoCount, setEnProcesoCount] = useState(0);
  const [resueltasCount, setResueltasCount] = useState(0);

  const navigate = useNavigate(); // Add this line to use navigation

  useEffect(() => {
    const fetchConsultas = async () => {
      const querySnapshot = await getDocs(collection(db, "Consultas"));
      const consultasData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setConsultas(consultasData);

      // Contadores
      const pendientes = consultasData.filter(
        (c) => c.estado === "Pendiente"
      ).length;
      const enProceso = consultasData.filter(
        (c) => c.estado === "En proceso"
      ).length;
      const resueltas = consultasData.filter(
        (c) => c.estado === "Resuelta"
      ).length;
      setPendientesCount(pendientes);
      setEnProcesoCount(enProceso);
      setResueltasCount(resueltas);
    };

    fetchConsultas();
  }, []);

  const handleResponderConsulta = (id) => {
    navigate(`/Respuestas/${id}`);
  };

  const handleToggleDetails = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
    if (expandedRow === id) {
      setEditType("");
      setCurrentId(null);
      setResolverDays(30);
    } else {
      const consulta = consultas.find((c) => c.id === id);
      setEditType(consulta.tipo || "");
      setCurrentId(id);
      setResolverDays(consulta.indicador || 30);
    }
  };

  const formatDateTime = (timestamp) => {
    return moment(timestamp.seconds * 1000)
      .tz("America/Caracas")
      .format("DD MMM YYYY, HH:mm");
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSave = async () => {
    if (currentId) {
      // Update existing consulta
      const consultaRef = doc(db, "Consultas", currentId);
      await updateDoc(consultaRef, { tipo: editType, indicador: resolverDays });
      setConsultas(
        consultas.map((c) =>
          c.id === currentId
            ? { ...c, tipo: editType, indicador: resolverDays }
            : c
        )
      );
      setExpandedRow(null);
    } else {
      // Add new consulta
      await addDoc(collection(db, "Consultas"), {
        tipo: editType || "No asignado", // Default to "No asignado"
        indicador: resolverDays || 0, // Default to 0
        // Include other necessary fields
      });
      setConsultas([
        ...consultas,
        {
          tipo: editType || "No asignado",
          indicador: resolverDays || 0 /* other fields */,
        },
      ]);
      // Reset state after saving
      setEditType("No asignado");
      setResolverDays(0); // Reset to default value
    }
  };

  const handleCommentClick = async (id) => {
    const { value: comment } = await Swal.fire({
      title: "Escribe tu comentario",
      input: "textarea",
      inputPlaceholder: "Escribe tu comentario aquí...",
      inputAttributes: {
        "aria-label": "Escribe tu comentario aquí",
      },
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) {
          return "El comentario no puede estar vacío";
        }
      },
    });

    if (comment) {
      // Guardar el comentario en Firebase
      const consultaRef = doc(db, "Consultas", id);
      await updateDoc(consultaRef, { comentario: comment });
      setConsultas(
        consultas.map((c) => (c.id === id ? { ...c, comentario: comment } : c))
      );
    }
  };

  const handleViewComment = async (id) => {
    const consulta = consultas.find((c) => c.id === id);

    // Mostrar el comentario en un SweetAlert
    const { value: result } = await Swal.fire({
      title: "Comentario",
      text: consulta?.comentario || "No hay comentario disponible",
      showCancelButton: true,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Eliminar comentario",
    });

    // Si el usuario selecciona eliminar el comentario
    if (result === undefined) {
      // Cancelar en lugar de resultado false
      const { isConfirmed } = await Swal.fire({
        title: "Confirmación",
        text: "¿Estás seguro de que deseas eliminar este comentario?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
      });

      if (isConfirmed) {
        try {
          // Eliminar el comentario del documento en Firestore
          const consultaRef = doc(db, "Consultas", id);
          await updateDoc(consultaRef, { comentario: "" });

          // Actualizar el estado local
          setConsultas(
            consultas.map((c) => (c.id === id ? { ...c, comentario: "" } : c))
          );

          // Confirmación de eliminación exitosa
          Swal.fire("Eliminado", "El comentario ha sido eliminado.", "success");
        } catch (error) {
          // Manejo de errores
          Swal.fire("Error", "No se pudo eliminar el comentario.", "error");
        }
      }
    }
  };

  const sortedConsultas = consultas.sort((a, b) => {
    if (orderBy === "fecha_solicitud") {
      return order === "asc"
        ? a.fecha_solicitud.seconds - b.fecha_solicitud.seconds
        : b.fecha_solicitud.seconds - a.fecha_solicitud.seconds;
    }

    if (orderBy === "estado") {
      const statesOrder = ["Pendiente", "En proceso", "Resuelto"];
      return order === "asc"
        ? statesOrder.indexOf(a.estado) - statesOrder.indexOf(b.estado)
        : statesOrder.indexOf(b.estado) - statesOrder.indexOf(a.estado);
    }

    const aValue = a[orderBy] || "";
    const bValue = b[orderBy] || "";

    if (orderBy === "tipo") {
      const typesOrder = [
        "Asesoría técnica",
        "Clasificación arancelaria",
        "No asignado",
      ];
      return order === "asc"
        ? typesOrder.indexOf(a.tipo || "No asignado") -
            typesOrder.indexOf(b.tipo || "No asignado")
        : typesOrder.indexOf(b.tipo || "No asignado") -
            typesOrder.indexOf(a.tipo || "No asignado");
    }

    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <TableContainer component={Paper} className="table-container">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("empresa")}
                className={`sort-button ${
                  orderBy === "empresa" ? "active" : ""
                }`}
              >
                Cliente
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "empresa"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("tipo")}
                className={`sort-button ${orderBy === "tipo" ? "active" : ""}`}
              >
                Tipo de Consulta
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "tipo"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("fecha_solicitud")}
                className={`sort-button ${
                  orderBy === "fecha_solicitud" ? "active" : ""
                }`}
              >
                Fecha de Solicitud
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "fecha_solicitud"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
            </TableCell>
            <TableCell>
              <Button className="sort-button">Indicador</Button>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("estado")}
                className={`sort-button ${
                  orderBy === "estado" ? "active" : ""
                }`}
              >
                Estado
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "estado"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
            </TableCell>
            <TableCell>Expandir</TableCell>
            <TableCell>Comentario</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedConsultas.map((consulta) => (
            <React.Fragment key={consulta.id}>
              <TableRow>
                <TableCell>{consulta.empresa}</TableCell>
                <TableCell>{consulta.tipo || "No asignado"}</TableCell>
                <TableCell>
                  {formatDateTime(consulta.fecha_solicitud)}
                </TableCell>
                <TableCell>
                  {consulta.indicador || 0} {"Días"}
                </TableCell>
                <TableCell>{consulta.estado}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleToggleDetails(consulta.id)}
                    className="expand-button"
                  >
                    <ExpandMoreIcon
                      style={{
                        transform:
                          expandedRow === consulta.id
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                        fontSize: 20,
                      }}
                    />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleCommentClick(consulta.id)}
                    className="comment-button"
                    style={{ marginRight: 8 }}
                  >
                    <ChatIcon style={{ fontSize: 20 }} />
                  </Button>
                  <Button
                    onClick={() => handleViewComment(consulta.id)}
                    className="view-comment-button"
                  >
                    <VisibilityIcon style={{ fontSize: 20 }} />
                  </Button>
                </TableCell>
              </TableRow>
              {expandedRow === consulta.id && (
                <TableRow>
                  <TableCell colSpan={8} className="details-cell">
                    <Box className="details-box">
                      <Box className="details-info">
                        <Typography variant="h6">
                          <strong>Nombre y Apellido:</strong>{" "}
                          {consulta.nombre || "No disponible"}{" "}
                          {consulta.apellido || "No disponible"}
                        </Typography>
                        <Typography variant="h6">
                          <strong>Empresa:</strong>{" "}
                          {consulta.empresa || "No disponible"}
                        </Typography>
                        <Typography variant="h6">
                          <strong>Correo:</strong>{" "}
                          {consulta.correo || "No disponible"}
                        </Typography>
                        <Typography variant="h6" marginTop={2}>
                          <strong>Consulta:</strong>{" "}
                          {consulta.mensaje || "No disponible"}
                        </Typography>
                        {consulta.adjuntado && (
                          <Box marginTop={2}>
                            <Typography variant="h6">
                              <strong>Archivo Adjunto:</strong>
                            </Typography>
                            <Box display="flex" alignItems="center">
                              {consulta.adjuntado
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
                      </Box>
                      <Box className="details-actions">
                        <Box className="select-group">
                          <Box className="select-container">
                            <Typography variant="h6">
                              Tipo de Consulta
                            </Typography>
                            <Select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                              className="select-type"
                            >
                              <MenuItem value="No asignado">
                                No asignado
                              </MenuItem>
                              <MenuItem value="Asesoría técnica">
                                Asesoría técnica
                              </MenuItem>
                              <MenuItem value="Clasificación arancelaria">
                                Clasificación arancelaria
                              </MenuItem>
                            </Select>
                          </Box>
                          <Box className="select-container">
                            <Typography variant="h6">
                              Días para resolver consulta
                            </Typography>
                            <Select
                              value={resolverDays}
                              onChange={(e) => setResolverDays(e.target.value)}
                              className="select-type"
                            >
                              {[...Array(31).keys()].map((day) => (
                                <MenuItem key={day} value={day}>
                                  {day}
                                </MenuItem>
                              ))}
                            </Select>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="contained"
                            onClick={handleSave}
                            sx={{
                              backgroundColor: "#1B5C94",
                              color: "white",
                              borderRadius: "70px",
                              "&:hover": {
                                backgroundColor: "#145a8c",
                              },
                            }}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => setExpandedRow(null)}
                            sx={{
                              backgroundColor: "#1B5C94",
                              color: "white",
                              borderRadius: "70px",
                              "&:hover": {
                                backgroundColor: "#145a8c",
                              },
                            }}
                          >
                            Cerrar
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => handleResponderConsulta(consulta.id)}
                            sx={{
                              backgroundColor: "#1B5C94",
                              color: "white",
                              borderRadius: "70px",
                              "&:hover": {
                                backgroundColor: "#145a8c",
                              },
                            }}
                          >
                            Responder consulta
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      <Grid container spacing={2} mt={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">CONSULTAS PENDIENTES:</Typography>
              <Typography variant="h4">{pendientesCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">CONSULTAS EN PROCESO:</Typography>
              <Typography variant="h4">{enProcesoCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">CONSULTAS RESUELTAS:</Typography>
              <Typography variant="h4">{resueltasCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </TableContainer>
  );
};

export default VistaAsesorFormulario;
