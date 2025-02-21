import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
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
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Menu,
  Popover,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChatIcon from "@mui/icons-material/Chat";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import { db, collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from "../firebaseConfig";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
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
  const [anchorElEstado, setAnchorElEstado] = useState(null);
  const [anchorElTipo, setAnchorElTipo] = useState(null);
  const [anchorElFecha, setAnchorElFecha] = useState(null); // Estado para el Popover de fecha
  const [selectedState, setSelectedState] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dateRange, setDateRange] = useState([null, null]); // Estado para el rango de fechas

  const navigate = useNavigate();

  useEffect(() => {
    const fetchConsultas = async () => {
      const querySnapshot = await getDocs(collection(db, "Consults"));
      const consultasData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setConsultas(consultasData);

      const pendientes = consultasData.filter((c) => c.status === "Pendiente").length;
      const enProceso = consultasData.filter((c) => c.status === "En proceso").length;
      const resueltas = consultasData.filter((c) => c.status === "Resuelta").length;
      setPendientesCount(pendientes);
      setEnProcesoCount(enProceso);
      setResueltasCount(resueltas);
    };
    fetchConsultas();

    const interval = setInterval(() => {
      setConsultas((prevConsultas) =>
        prevConsultas.map((consulta) => ({
          ...consulta,
          indicador: calculateRemainingDays(consulta.star_date, consulta.indicator),
        }))
      );
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  const calculateRemainingDays = (startDate, indicadorOriginal) => {
    if (!startDate || typeof startDate.toDate !== "function") {
      return indicadorOriginal;
    }

    const now = new Date();
    const start = startDate.toDate();
    const differenceInMs = now - start;
    const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
    const remainingDays = indicadorOriginal - differenceInDays;
    return remainingDays > 0 ? remainingDays : 0;
  };

  const handleResponderConsulta = (id) => {
    navigate(`/Respuestas/${id}`);
  };

  const handleSelectState = (status) => {
    setSelectedState(status);
    setAnchorElEstado(null);
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setAnchorElTipo(null);
  };

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
      setResolverDays(consulta.indicator || 30);
    }
  };

  const formatDateTime = (timestamp) => {
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
    try {
      if (currentId) {
        const consultaRef = doc(db, "Consults", currentId);
        await updateDoc(consultaRef, {
          type: editType || "No Asignado",
          indicator: resolverDays || 0,
        });

        setConsultas(
          consultas.map((c) =>
            c.id === currentId
              ? {
                  ...c,
                  type: editType || "No Asignado",
                  indicator: resolverDays || 0,
                }
              : c
          )
        );
      } else {
        await addDoc(collection(db, "Consults"), {
          type: editType || "No Asignado",
          indicator: resolverDays || 0,
          star_date: new Date(),
        });

        setConsultas([
          ...consultas,
          {
            type: editType || "No Asignado",
            indicator: resolverDays || 0,
            star_date: new Date(),
          },
        ]);
      }

      setEditType("");
      setResolverDays(0);
      setExpandedRow(null);
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire("Error", "No se pudo guardar los cambios.", "error");
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
      const consultaRef = doc(db, "Consults", id);
      await updateDoc(consultaRef, { comentario: comment });
      setConsultas(consultas.map((c) => (c.id === id ? { ...c, comentario: comment } : c)));
    }
  };

  const handleDeleteConsulta = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Confirmación",
      text: "¿Estás seguro de que deseas eliminar esta consulta?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (isConfirmed) {
      try {
        const consultaRef = doc(db, "Consults", id);
        await deleteDoc(consultaRef);
        setConsultas(consultas.filter((c) => c.id !== id));
        Swal.fire("Eliminado", "La consulta ha sido eliminada.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la consulta.", "error");
      }
    }
  };

  const handleViewComment = async (id) => {
    const consulta = consultas.find((c) => c.id === id);

    const { value: result } = await Swal.fire({
      title: "Comentario",
      text: consulta?.comentario || "No hay comentario disponible",
      showCancelButton: true,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Eliminar comentario",
    });

    if (result === undefined) {
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
          const consultaRef = doc(db, "Consults", id);
          await updateDoc(consultaRef, { comentario: "" });
          setConsultas(consultas.map((c) => (c.id === id ? { ...c, comentario: "" } : c)));
          Swal.fire("Eliminado", "El comentario ha sido eliminado.", "success");
        } catch (error) {
          Swal.fire("Error", "No se pudo eliminar el comentario.", "error");
        }
      }
    }
  };

  // Filtrar las consultas por tipo, estado y rango de fechas
  const filteredConsultas = consultas.filter((consulta) => {
    const matchesType = !selectedType || consulta.type === selectedType;
    const matchesState = !selectedState || consulta.status === selectedState;

    // Filtrar por rango de fechas
    const consultaDate = consulta.star_date?.toDate();
    const [startDate, endDate] = dateRange;

    const matchesDateRange =
      !startDate ||
      !endDate ||
      (consultaDate >= startDate && consultaDate <= endDate);

    return matchesType && matchesState && matchesDateRange;
  });

  // Ordenar las consultas filtradas
  const sortedConsultas = filteredConsultas.sort((a, b) => {
    if (orderBy === "status") {
      const statesOrder = ["Pendiente", "En proceso", "Resuelto"];
      const aPriority = a.status === selectedState ? -1 : statesOrder.indexOf(a.status);
      const bPriority = b.status === selectedState ? -1 : statesOrder.indexOf(b.status);
      return order === "asc" ? aPriority - bPriority : bPriority - aPriority;
    }

    if (orderBy === "apply_date") {
      return order === "asc"
        ? (a.apply_date?.seconds || 0) - (b.apply_date?.seconds || 0)
        : (b.apply_date?.seconds || 0) - (a.apply_date?.seconds || 0);
    }

    if (orderBy === "type") {
      const typesOrder = ["Clasificación Arancelaria", "Asesoría técnica", "No asignado"];
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
                className={`sort-button ${orderBy === "company" ? "active" : ""}`}
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
              <Box display="flex" alignItems="center">
                <Button
                  onClick={(event) => setAnchorElTipo(event.currentTarget)}
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
                <Menu
                  id="type-menu"
                  anchorEl={anchorElTipo}
                  open={Boolean(anchorElTipo)}
                  onClose={() => setAnchorElTipo(null)}
                >
                  <MenuItem onClick={() => handleSelectType("")}>Todos</MenuItem>
                  <MenuItem onClick={() => handleSelectType("No asignado")}>No asignado</MenuItem>
                  <MenuItem onClick={() => handleSelectType("Asesoría técnica")}>Asesoría técnica</MenuItem>
                  <MenuItem onClick={() => handleSelectType("Clasificación arancelaria")}>Clasificación arancelaria</MenuItem>
                </Menu>
              </Box>
            </TableCell>
            <TableCell>
              <Button
                onClick={(event) => setAnchorElFecha(event.currentTarget)} // Abre el Popover de fecha
                className={`sort-button ${orderBy === "star_date" ? "active" : ""}`}
              >
                Fecha de Solicitud
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "star_date"
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
                id="fecha-popover"
                open={Boolean(anchorElFecha)}
                anchorEl={anchorElFecha}
                onClose={() => setAnchorElFecha(null)}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "center",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "center",
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateRangePicker
                    value={dateRange}
                    onChange={(newValue) => setDateRange(newValue)}
                  />
                </LocalizationProvider>
              </Popover>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("indicator")}
                className={`sort-button ${orderBy === "indicator" ? "active" : ""}`}
              >
                Indicador
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "indicator"
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
                onClick={(event) => setAnchorElEstado(event.currentTarget)}
                className={`sort-button ${orderBy === "status" ? "active" : ""}`}
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
              <Menu
                id="state-menu"
                anchorEl={anchorElEstado}
                open={Boolean(anchorElEstado)}
                onClose={() => setAnchorElEstado(null)}
              >
                <MenuItem onClick={() => handleSelectState("")}>Todos</MenuItem>
                <MenuItem onClick={() => handleSelectState("Pendiente")}>Pendiente</MenuItem>
                <MenuItem onClick={() => handleSelectState("En proceso")}>En proceso</MenuItem>
                <MenuItem onClick={() => handleSelectState("Resuelto")}>Resuelto</MenuItem>
              </Menu>
            </TableCell>
            <TableCell>Comentario</TableCell>
            <TableCell>Borrar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedConsultas.map((consulta) => (
            <React.Fragment key={consulta.id}>
              <TableRow
                onClick={(e) => {
                  if (
                    e.target.tagName !== "BUTTON" &&
                    !e.target.classList.contains("comment-button") &&
                    !e.target.classList.contains("view-comment-button") &&
                    !e.target.classList.contains("delete-button")
                  ) {
                    handleToggleDetails(consulta.id);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <TableCell>{consulta.company}</TableCell>
                <TableCell>{consulta.type || "No Asignado"}</TableCell>
                <TableCell>{formatDateTime(consulta.star_date)}</TableCell>
                <TableCell>
                  {consulta.indicator !== undefined && consulta.indicator !== null && (
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor:
                          calculateRemainingDays(consulta.apply_date, consulta.indicator) <= 1
                            ? "red"
                            : "green",
                        marginRight: "8px",
                      }}
                    />
                  )}
                  {consulta.indicator === undefined || consulta.indicator === null
                    ? "No asignado"
                    : `${calculateRemainingDays(consulta.apply_date, consulta.indicator)} Días`}
                </TableCell>
                <TableCell>{consulta.status}</TableCell>
                <TableCell>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCommentClick(consulta.id);
                    }}
                    className="comment-button"
                    style={{ marginRight: 8, border: "none", padding: 0 }}
                  >
                    <ChatIcon style={{ fontSize: 20 }} />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewComment(consulta.id);
                    }}
                    className="view-comment-button"
                    style={{ border: "none", padding: 0 }}
                  >
                    <VisibilityIcon style={{ fontSize: 20 }} />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConsulta(consulta.id);
                    }}
                    className="delete-button"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </Button>
                </TableCell>
              </TableRow>
              {expandedRow === consulta.id && (
                <TableRow>
                  <TableCell colSpan={8} className="details-cell">
                    <Box className="details-box">
                      <Box className="details-info">
                        <Typography variant="h6">
                          <strong>Nombre y Apellido:</strong> {consulta.name || "No disponible"}
                        </Typography>
                        <Typography variant="h6">
                          <strong>Empresa:</strong> {consulta.company || "No disponible"}
                        </Typography>
                        <Typography variant="h6">
                          <strong>Correo:</strong> {consulta.email || "No disponible"}
                        </Typography>
                        <Typography variant="h6" marginTop={2}>
                          <strong>Consulta:</strong> {consulta.messageContent || "No disponible"}
                        </Typography>
                        <Typography variant="h6">
                          <strong>Fecha de Solicitud:</strong>{" "}
                          {consulta.timestamp?.seconds
                            ? new Date(consulta.timestamp.seconds * 1000).toLocaleString()
                            : "Fecha no disponible"}
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
                            <Typography variant="h6">Tipo de Consulta</Typography>
                            <Select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                              className="select-type"
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return "No Asignado";
                                }
                                return selected;
                              }}
                            >
                              <MenuItem value="Asesoría técnica">Asesoría técnica</MenuItem>
                              <MenuItem value="Clasificación arancelaria">
                                Clasificación arancelaria
                              </MenuItem>
                            </Select>
                          </Box>
                          <Box className="select-container">
                            <Typography variant="h6">Días para resolver consulta</Typography>
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
                            onClick={() => handleSave(consulta)}
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