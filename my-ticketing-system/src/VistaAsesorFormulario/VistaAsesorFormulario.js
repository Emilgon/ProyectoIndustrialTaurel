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
  Divider,
  Grid,
  IconButton,
  Card,
  CardContent,
  Menu,
  Popover,
  Avatar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChatIcon from "@mui/icons-material/Chat";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import DownloadIcon from "@mui/icons-material/Download";
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  AttachFile as AttachFileIcon,
} from "@mui/icons-material";
import {
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Description as DocIcon,
  TableChart as CsvIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { db, collection, getDocs, updateDoc, doc, addDoc, deleteDoc, query, where } from "../firebaseConfig";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import "./VistaAsesorFormulario.css";

const VistaAsesorFormulario = () => {
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [historialAbierto, setHistorialAbierto] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("company");
  const [editType, setEditType] = useState("No Asignado");
  const [currentId, setCurrentId] = useState(null);
  const [resolverDays, setResolverDays] = useState(null); // Cambiado a null para "No Asignado"
  const [pendientesCount, setPendientesCount] = useState(0);
  const [enProcesoCount, setEnProcesoCount] = useState(0);
  const [resueltasCount, setResueltasCount] = useState(0);
  const [anchorElEstado, setAnchorElEstado] = useState(null);
  const [anchorElTipo, setAnchorElTipo] = useState(null);
  const [anchorElFecha, setAnchorElFecha] = useState(null);
  const [selectedState, setSelectedState] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [alertShown, setAlertShown] = useState(false);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});

  const navigate = useNavigate();
  const storage = getStorage();

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
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const consultasCercanas = consultas.filter(
      (consulta) => calculateRemainingDays(consulta.apply_date, consulta.indicator) <= 1
    ).length;

    if (consultasCercanas > 0 && !alertShown) {
      Swal.fire({
        title: "Alerta",
        text: `Hay ${consultasCercanas} consultas que tienen muy pocos días para ser respondidas.`,
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      setAlertShown(true);
    } else if (consultasCercanas === 0) {
      setAlertShown(false);
    }
  }, [consultas, alertShown]);

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

  const handleToggleDetails = async (id) => {
    if (historialAbierto === id) {
      setHistorialAbierto(null);
    }
    setExpandedRow(expandedRow === id ? null : id);
    if (expandedRow === id) {
      setEditType("No Asignado");
      setCurrentId(null);
      setResolverDays(null);
    } else {
      const consulta = consultas.find((c) => c.id === id);
      setEditType(consulta.type || "No Asignado");
      setCurrentId(id);
      setResolverDays(consulta.indicator || null);

      if (consulta.attachment) {
        const urls = await fetchDownloadUrls(consulta.attachment);
        setFileDownloadUrls((prevUrls) => ({ ...prevUrls, ...urls }));
      }
    }
  };

  const handleToggleHistorial = async (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    }
    if (historialAbierto === id) {
      setHistorialAbierto(null);
    } else {
      await obtenerRespuestas(id);
      setHistorialAbierto(id);
    }
  };

  const obtenerRespuestas = async (consultaId) => {
    try {
      const respuestasRef = query(collection(db, "Responses"), where("consultaId", "==", consultaId));
      const respuestasSnapshot = await getDocs(respuestasRef);
      const respuestasData = respuestasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRespuestas(respuestasData);
    } catch (error) {
      console.error("Error al obtener las respuestas:", error);
    }
  };

  const fetchDownloadUrls = async (attachments) => {
    const urls = {};
    for (const fileName of attachments.split(", ")) {
      try {
        const storageRef = ref(storage, `ruta_de_tus_archivos/${fileName}`);
        const url = await getDownloadURL(storageRef);
        urls[fileName] = url;
      } catch (error) {
        console.error("Error al obtener la URL de descarga:", error);
      }
    }
    return urls;
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
          indicator: resolverDays === null ? null : resolverDays,
        });

        setConsultas(
          consultas.map((c) =>
            c.id === currentId
              ? {
                ...c,
                type: editType || "No Asignado",
                indicator: resolverDays === null ? null : resolverDays,
              }
              : c
          )
        );
      } else {
        await addDoc(collection(db, "Consults"), {
          type: editType || "No Asignado",
          indicator: resolverDays === null ? null : resolverDays,
          star_date: new Date(),
        });

        setConsultas([
          ...consultas,
          {
            type: editType || "No Asignado",
            indicator: resolverDays === null ? null : resolverDays,
            star_date: new Date(),
          },
        ]);
      }

      setEditType("No Asignado");
      setResolverDays(null);
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

  const filteredConsultas = consultas.filter((consulta) => {
    const matchesType = !selectedType || consulta.type === selectedType;
    const matchesState = !selectedState || consulta.status === selectedState;

    const consultaDate = consulta.star_date?.toDate();
    const [startDate, endDate] = dateRange;

    const matchesDateRange =
      !startDate ||
      !endDate ||
      (consultaDate >= startDate && consultaDate <= endDate);

    return matchesType && matchesState && matchesDateRange;
  });

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
      const typesOrder = ["Clasificación Arancelaria", "Asesoría técnica", "No Asignado"];
      const aIndex = typesOrder.indexOf(a.type || "No Asignado");
      const bIndex = typesOrder.indexOf(b.type || "No Asignado");
      return order === "asc" ? aIndex - bIndex : bIndex - aIndex;
    }

    const aValue = a[orderBy] || "";
    const bValue = b[orderBy] || "";

    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <PdfIcon sx={{ color: "#FF0000", fontSize: 30 }} />;
      case "csv":
        return <CsvIcon sx={{ color: "#4CAF50", fontSize: 30 }} />;
      case "doc":
      case "docx":
        return <DocIcon sx={{ color: "#2196F3", fontSize: 30 }} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon sx={{ color: "#FFC107", fontSize: 30 }} />;
      default:
        return <FileIcon sx={{ color: "#9E9E9E", fontSize: 30 }} />;
    }
  };

  const renderAttachments = (attachments) => {
    return attachments.split(", ").map((fileName) => {
      const fileUrl = fileDownloadUrls[fileName];
      const isImage = ["jpg", "jpeg", "png", "gif"].includes(
        fileName.split(".").pop().toLowerCase()
      );

      return (
        <Box
          key={fileName}
          display="flex"
          alignItems="center"
          gap={1}
          mb={1}
          sx={{
            p: 1,
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            "&:hover": { backgroundColor: "#f5f5f5" },
          }}
        >
          {fileUrl && (
            <IconButton
              component="a"
              href={fileUrl}
              download
              rel="noopener noreferrer"
              aria-label={`Descargar archivo ${fileName}`}
              sx={{
                padding: 0,
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={fileName}
                  style={{
                    maxWidth: "50px",
                    maxHeight: "50px",
                    borderRadius: "4px",
                  }}
                />
              ) : (
                getFileIcon(fileName)
              )}
            </IconButton>
          )}

          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {fileName}
          </Typography>
        </Box>
      );
    });
  };

  const resetFilters = () => {
    setSelectedState("");
    setSelectedType("");
    setDateRange([null, null]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Consultas
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            Swal.fire({
              title: "¿Estás seguro?",
              text: "¿Quieres regresar al menú? Los cambios no guardados se perderán.",
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Sí, salir",
              cancelButtonText: "Cancelar",
              confirmButtonColor: "#1B5C94",
              cancelButtonColor: "#d33",
            }).then((result) => {
              if (result.isConfirmed) {
                navigate("/menu");
              }
            });
          }}
          sx={{
            marginRight: 2,
            borderColor: "red",
            color: "red",
            borderRadius: "20px",
            "&:hover": {
              borderColor: "#145a8c",
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          Salir
        </Button>
        <Button
          variant="outlined"
          onClick={resetFilters}
          sx={{
            borderColor: "#1B5C94",
            color: "#1B5C94",
            borderRadius: "20px",
            "&:hover": {
              borderColor: "#145a8c",
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          Resetear Filtros
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#1B5C94" }}>
              <TableCell>
                <Button
                  onClick={() => handleRequestSort("company")}
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  Cliente
                  <ExpandMoreIcon
                    sx={{
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
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Tipo de Consulta
                    <ExpandMoreIcon
                      sx={{
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
                    <MenuItem onClick={() => handleSelectType("No Asignado")}>No Asignado</MenuItem>
                    <MenuItem onClick={() => handleSelectType("Asesoría técnica")}>Asesoría técnica</MenuItem>
                    <MenuItem onClick={() => handleSelectType("Clasificación arancelaria")}>Clasificación arancelaria</MenuItem>
                  </Menu>
                </Box>
              </TableCell>
              <TableCell>
                <Button
                  onClick={(event) => setAnchorElFecha(event.currentTarget)}
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  Fecha de Solicitud
                  <ExpandMoreIcon
                    sx={{
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
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  Indicador
                  <ExpandMoreIcon
                    sx={{
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
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  Estado
                  <ExpandMoreIcon
                    sx={{
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
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Historial</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Comentario</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Borrar</TableCell>
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
                      !e.target.classList.contains("delete-button") &&
                      !e.target.classList.contains("historial-button")
                    ) {
                      handleToggleDetails(consulta.id);
                    }
                  }}
                  sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f5f5f5" } }}
                >
                  <TableCell>{consulta.company}</TableCell>
                  <TableCell>{consulta.type || "No Asignado"}</TableCell>
                  <TableCell>{formatDateTime(consulta.star_date)}</TableCell>
                  <TableCell>
                    {consulta.indicator !== undefined && consulta.indicator !== null ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor:
                              calculateRemainingDays(consulta.apply_date, consulta.indicator) <= 1
                                ? "red"
                                : "green",
                            mr: 1,
                          }}
                        />
                        <Typography>
                          {calculateRemainingDays(consulta.apply_date, consulta.indicator)} Días
                        </Typography>
                      </Box>
                    ) : (
                      <Typography>No Asignado</Typography>
                    )}
                  </TableCell>
                  <TableCell>{consulta.status}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleHistorial(consulta.id);
                      }}
                      className="historial-button"
                      sx={{ color: "#1B5C94" }}
                    >
                      <HistoryIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCommentClick(consulta.id);
                      }}
                      sx={{ minWidth: 0, p: 0 }}
                    >
                      <ChatIcon sx={{ color: "#1B5C94" }} />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewComment(consulta.id);
                      }}
                      sx={{ minWidth: 0, p: 0, ml: 1 }}
                    >
                      <VisibilityIcon sx={{ color: "#1B5C94" }} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConsulta(consulta.id);
                      }}
                      sx={{ minWidth: 0, p: 0 }}
                    >
                      <DeleteIcon sx={{ color: "red" }} />
                    </Button>
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                  {expandedRow === consulta.id && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ p: 0 }}>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <Card sx={{ m: 2, boxShadow: 3, borderRadius: 2 }}>
                            <CardContent>
                              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#1B5C94" }}>
                                Detalles de la Consulta
                              </Typography>
                              <Grid container spacing={1} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1, width: 40, height: 40 }}>
                                      <PersonIcon fontSize="medium" />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6" fontWeight="bold">
                                        Nombre y Apellido
                                      </Typography>
                                      <Typography variant="body1">
                                        {consulta.name || "No disponible"}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1, width: 40, height: 40 }}>
                                      <BusinessIcon fontSize="medium" />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6" fontWeight="bold">
                                        Empresa
                                      </Typography>
                                      <Typography variant="body1">
                                        {consulta.company || "No disponible"}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1, width: 40, height: 40 }}>
                                      <EmailIcon fontSize="medium" />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6" fontWeight="bold">
                                        Correo
                                      </Typography>
                                      <Typography variant="body1">
                                        {consulta.email || "No disponible"}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1, width: 40, height: 40 }}>
                                      <CalendarIcon fontSize="medium" />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6" fontWeight="bold">
                                        Fecha de Solicitud
                                      </Typography>
                                      <Typography variant="body1">
                                        {consulta.timestamp?.seconds
                                          ? new Date(consulta.timestamp.seconds * 1000).toLocaleString()
                                          : "Fecha no disponible"}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                <Grid item xs={12}>
                                  <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: "#1B5C94", mr: 1, width: 40, height: 40 }}>
                                      <DescriptionIcon fontSize="medium" />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6" fontWeight="bold">
                                        Consulta
                                      </Typography>
                                      <Typography variant="body1">
                                        {consulta.messageContent || "No disponible"}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                {consulta.attachment && (
                                  <Grid item xs={12}>
                                    <Box display="flex" alignItems="center">
                                      <Avatar sx={{ bgcolor: "#1B5C94", mr: 1, width: 40, height: 40 }}>
                                        <AttachFileIcon fontSize="medium" />
                                      </Avatar>
                                      <Box sx={{ width: "100%" }}>
                                        <Typography variant="h6" fontWeight="bold">
                                          Archivo Adjunto
                                        </Typography>
                                        {renderAttachments(consulta.attachment)}
                                      </Box>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                              <Divider sx={{ my: 2 }} />
                              <Grid container spacing={1} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Tipo de Consulta
                                  </Typography>
                                  <Select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value)}
                                    fullWidth
                                    displayEmpty
                                    sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}
                                  >
                                    <MenuItem value="No Asignado">No Asignado</MenuItem>
                                    <MenuItem value="Asesoría técnica">Asesoría técnica</MenuItem>
                                    <MenuItem value="Clasificación arancelaria">
                                      Clasificación arancelaria
                                    </MenuItem>
                                  </Select>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Días para resolver consulta
                                  </Typography>
                                  <Select
                                    value={resolverDays === null ? "No Asignado" : resolverDays}
                                    onChange={(e) => {
                                      const value = e.target.value === "No Asignado" ? null : e.target.value;
                                      setResolverDays(value);
                                    }}
                                    fullWidth
                                    displayEmpty
                                    sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}
                                  >
                                    <MenuItem value="No Asignado">No Asignado</MenuItem>
                                    {[...Array(31).keys()].map((day) => (
                                      <MenuItem key={day} value={day}>
                                        {day}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </Grid>
                              </Grid>
                              <Box display="flex" justifyContent="center" gap={2} mt={2}>
                                <Button
                                  variant="contained"
                                  onClick={handleSave}
                                  sx={{
                                    backgroundColor: "#1B5C94",
                                    color: "white",
                                    borderRadius: "20px",
                                    "&:hover": {
                                      backgroundColor: "#145a8c",
                                    },
                                  }}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => setExpandedRow(null)}
                                  sx={{
                                    borderColor: "#1B5C94",
                                    color: "#1B5C94",
                                    borderRadius: "20px",
                                    "&:hover": {
                                      borderColor: "#145a8c",
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
                                    borderRadius: "20px",
                                    "&:hover": {
                                      backgroundColor: "#145a8c",
                                    },
                                  }}
                                >
                                  Responder consulta
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                  {historialAbierto === consulta.id && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ p: 0 }}>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <Card sx={{ m: 2, boxShadow: 3, borderRadius: 2 }}>
                            <CardContent>
                              <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Historial de Respuestas
                              </Typography>
                              {respuestas.length > 0 ? (
                                respuestas.map((respuesta) => (
                                  <Box
                                    key={respuesta.id}
                                    sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}
                                  >
                                    <Typography variant="body1">
                                      <strong>Respuesta:</strong> {respuesta.reply}
                                    </Typography>
                                    {respuesta.timestamp && (
                                      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                                        Enviado el: {new Date(respuesta.timestamp.seconds * 1000).toLocaleString()}
                                      </Typography>
                                    )}
                                    {respuesta.attachmentReply && (
                                      <Box sx={{ mt: 2 }}>
                                        <Typography variant="body1" fontWeight="bold" gutterBottom>
                                          Archivo Adjunto
                                        </Typography>
                                        <Box
                                          display="flex"
                                          alignItems="center"
                                          gap={1}
                                          sx={{
                                            p: 1,
                                            border: "1px solid #e0e0e0",
                                            borderRadius: 1,
                                            "&:hover": { backgroundColor: "#f5f5f5" },
                                          }}
                                        >
                                          {getFileIcon(respuesta.attachmentReply.split("/").pop())}
                                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                            {respuesta.attachmentReply.split("/").pop()}
                                          </Typography>
                                          <IconButton
                                            component="a"
                                            href={respuesta.attachmentReply}
                                            download
                                            rel="noopener noreferrer"
                                            sx={{
                                              color: "#1B5C94",
                                              "&:hover": {
                                                backgroundColor: "#e3f2fd",
                                              },
                                            }}
                                          >
                                            <DownloadIcon />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    )}
                                  </Box>
                                ))
                              ) : (
                                <Typography variant="body1">No hay respuestas aún.</Typography>
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
      <Grid container spacing={2} mt={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                CONSULTAS PENDIENTES:
              </Typography>
              <Typography variant="h4" color="error">
                {pendientesCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                CONSULTAS EN PROCESO:
              </Typography>
              <Typography variant="h4" color="warning.main">
                {enProcesoCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                CONSULTAS RESUELTAS:
              </Typography>
              <Typography variant="h4" color="success.main">
                {resueltasCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VistaAsesorFormulario;