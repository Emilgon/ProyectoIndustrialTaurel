import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, Box, Select, MenuItem, Grid, Card, CardContent, Popover, } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChatIcon from "@mui/icons-material/Chat";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import { db, collection, getDocs, updateDoc, doc, addDoc, } from "../firebaseConfig";
import "./VistaAsesorFormulario.css";

const VistaAsesorFormulario = () => {
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("company");
  const [editType, setEditType] = useState("No asignado");
  const [currentId, setCurrentId] = useState(null);
  const [resolverDays, setResolverDays] = useState(0);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [enProcesoCount, setEnProcesoCount] = useState(0);
  const [resueltasCount, setResueltasCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedState, setSelectedState] = useState("");

  const navigate = useNavigate();

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
        (c) => c.status === "Pendiente"
      ).length;
      const enProceso = consultasData.filter(
        (c) => c.status === "En proceso"
      ).length;
      const resueltas = consultasData.filter(
        (c) => c.status === "Resuelta"
      ).length;
      setPendientesCount(pendientes);
      setEnProcesoCount(enProceso);
      setResueltasCount(resueltas);

      const consultasExpiracion = consultasData.filter(
        (consulta) => calculateRemainingDays(consulta.start_date, consulta.indicador) <= 1
      );

      if (consultasExpiracion.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "¡Advertencia!",
          text: `Hay ${consultasExpiracion.length} consulta(s) con muy poco tiempo restante para ser respondidas.`,
          confirmButtonText: "Entendido",
        });
      }
    };
    fetchConsultas();

    const interval = setInterval(() => {
      setConsultas((prevConsultas) =>
        prevConsultas.map((consulta) => ({
          ...consulta,
          indicador: calculateRemainingDays(
            consulta.start_date,
            consulta.indicador
          ),
        }))
      );
    }, 3600000); // 1 hora

    return () => clearInterval(interval);
  }, []);

  function calculateRemainingDays(startDate, indicadorOriginal) {
    if (!startDate || typeof startDate.toDate !== "function") {
      return indicadorOriginal;
    }

    const now = new Date(); // Fecha y hora actual
    const start = startDate.toDate(); // Convertir fechaInicio a un objeto Date

    // Calcular la diferencia en milisegundos entre la fecha actual y la fecha de inicio
    const differenceInMs = now - start;

    // Convertir la diferencia a días, redondeando hacia abajo
    const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

    // Calcular los días restantes
    const remainingDays = indicadorOriginal - differenceInDays;

    // Asegurar que el valor del indicador nunca sea negativo
    return remainingDays > 0 ? remainingDays : 0;
  }

  const handleResponderConsulta = (id) => {
    navigate(`/Respuestas/${id}`);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectState = (status) => {
    setSelectedState(status);
    setOrderBy("status");
    setOrder("asc");
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const handleToggleDetails = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
    if (expandedRow === id) {
      setEditType("");
      setCurrentId(null);
      setResolverDays(30);
    } else {
      const consulta = consultas.find((c) => c.id === id);
      setEditType(consulta.type || "");
      setCurrentId(id);
      setResolverDays(consulta.indicador || 30);
    }
  };

  const formatDateTime = (timestamp) => {
    // Verificar si el timestamp es válido y tiene la propiedad 'seconds'
    if (!timestamp || !timestamp.seconds) {
      return "Fecha no disponible";
    }

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
      await updateDoc(consultaRef, {
        type: editType,
        indicador: resolverDays,
        start_date: new Date(), // Guardar fecha actual
      });
      setConsultas(
        consultas.map((c) =>
          c.id === currentId
            ? {
              ...c,
              type: editType,
              indicador: resolverDays,
              start_date: new Date(),
            }
            : c
        )
      );
      setExpandedRow(null);
    } else {
      // Add new consulta
      await addDoc(collection(db, "Consultas"), {
        type: editType || "No asignado", // Default to "No asignado"
        indicador: resolverDays || 0, // Default to 0
      });
      setConsultas([
        ...consultas,
        {
          type: editType || "No asignado",
          indicador: resolverDays || 0,
        },
      ]);
      setEditType("No asignado");
      setResolverDays(0);
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
    if (orderBy === "status") {
      const statesOrder = ["Pendiente", "En proceso", "Resuelto"];
      const aPriority =
        a.status === selectedState ? -1 : statesOrder.indexOf(a.status);
      const bPriority =
        b.status === selectedState ? -1 : statesOrder.indexOf(b.status);
      return order === "asc" ? aPriority - bPriority : bPriority - aPriority;
    }

    if (orderBy === "apply_date") {
      return order === "asc"
        ? (a.apply_date?.seconds || 0) - (b.apply_date?.seconds || 0)
        : (b.apply_date?.seconds || 0) - (a.apply_date?.seconds || 0);
    }


    if (orderBy === "type") {
      const typesOrder = [
        "Clasificación Arancelaria",
        "Asesoría técnica",
        "No asignado",
      ];
      const aIndex = typesOrder.indexOf(a.type || "No asignado");
      const bIndex = typesOrder.indexOf(b.type || "No asignado");
      return order === "asc" ? aIndex - bIndex : bIndex - aIndex;
    }

    const aValue = a[orderBy] || "";
    const bValue = b[orderBy] || "";

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
                onClick={() => handleRequestSort("company")}
                className={`sort-button ${orderBy === "company" ? "active" : ""
                  }`}
              >
                Cliente
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "company"
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
                onClick={() => handleRequestSort("type")}
                className={`sort-button ${orderBy === "type" ? "active" : ""}`}
              >
                Tipo de Consulta
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "type"
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
                onClick={() => handleRequestSort("apply_date")}
                className={`sort-button ${orderBy === "apply_date" ? "active" : ""
                  }`}
              >
                Fecha de Solicitud
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "apply_date"
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
                onClick={() => handleRequestSort("indicador")}
                className={`sort-button ${orderBy === "indicador" ? "active" : ""
                  }`}
              >
                Indicador
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "indicador"
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
                onClick={handleClick}
                className={`sort-button ${orderBy === "status" ? "active" : ""
                  }`}
              >
                Estado
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "status"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
              >
                <MenuItem onClick={() => handleSelectState("Pendiente")}>
                  Pendiente
                </MenuItem>
                <MenuItem onClick={() => handleSelectState("En proceso")}>
                  En proceso
                </MenuItem>
                <MenuItem onClick={() => handleSelectState("Resuelto")}>
                  Resuelto
                </MenuItem>
              </Popover>
            </TableCell>
            <TableCell>Expandir</TableCell>
            <TableCell>Comentario</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedConsultas.map((consulta) => (
            <React.Fragment key={consulta.id}>
              <TableRow>
                <TableCell>{consulta.company}</TableCell>
                <TableCell>{consulta.type || "No asignado"}</TableCell>
                <TableCell>
                  {formatDateTime(consulta.apply_date)}
                </TableCell>
                <TableCell>
                  {consulta.indicador !== undefined &&
                    consulta.indicador !== null && (
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor:
                            calculateRemainingDays(
                              consulta.start_date,
                              consulta.indicador
                            ) <= 1
                              ? "red"
                              : "green",
                          marginRight: "8px",
                        }}
                      />
                    )}
                  {consulta.indicador === undefined ||
                    consulta.indicador === null
                    ? "No asignado"
                    : `${calculateRemainingDays(
                      consulta.start_date,
                      consulta.indicador
                    )} Días`}
                </TableCell>
                <TableCell>{consulta.status}</TableCell>
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
                          {consulta.given_name || "No disponible"}{" "}
                          {consulta.last_name || "No disponible"}
                        </Typography>
                        <Typography variant="h6">
                          <strong>Empresa:</strong>{" "}
                          {consulta.company || "No disponible"}
                        </Typography>
                        <Typography variant="h6">
                          <strong>Correo:</strong>{" "}
                          {consulta.email || "No disponible"}
                        </Typography>
                        <Typography variant="h6" marginTop={2}>
                          <strong>Consulta:</strong>{" "}
                          {consulta.message || "No disponible"}
                        </Typography>
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