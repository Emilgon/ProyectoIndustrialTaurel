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
  MenuItem as MuiMenuItem,
  Divider,
  Grid,
  IconButton,
  Card,
  CardContent,
  Menu,
  Popover,
  Avatar,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckIcon from '@mui/icons-material/Check';
import ChatIcon from "@mui/icons-material/Chat";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import DownloadIcon from "@mui/icons-material/Download";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from '@mui/icons-material/Close';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import LogoutIcon from '@mui/icons-material/Logout';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachFile as AttachFileIcon,
} from "@mui/icons-material";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { db, collection, getDocs, updateDoc, doc, deleteDoc, query, where } from "../firebaseConfig";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from 'dayjs';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import "./VistaAsesorFormulario.css";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CategoryIcon from '@mui/icons-material/Category';
import TimerIcon from '@mui/icons-material/Timer';
import AssignmentIcon from '@mui/icons-material/Assignment';

const VistaAsesorFormulario = () => {
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [historialAbierto, setHistorialAbierto] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("company");
  const [editType, setEditType] = useState("No Asignado");
  const [selectedConsultId, setSelectedConsultId] = useState(null);
  const [resolverDays, setResolverDays] = useState(null);
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
  const [unassignedAlertShown, setUnassignedAlertShown] = useState(false);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});
  const [anchorElIndicador, setAnchorElIndicador] = useState(null);
  const [indicadorFilter, setIndicadorFilter] = useState("todos");
  const [searchCompany, setSearchCompany] = useState("");
  const [anchorElSearch, setAnchorElSearch] = useState(null);

  const navigate = useNavigate();
  const storage = getStorage();

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

  useEffect(() => {
    const fetchConsultas = async () => {
      const querySnapshot = await getDocs(collection(db, "Consults"));
      const consultasData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          remaining_days: data.start_date ?
            calculateRemainingDays(data.start_date, data.indicator) :
            data.indicator
        };
      });
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
      setConsultas(prevConsultas =>
        prevConsultas.map(consulta => {
          if (consulta.start_date && consulta.indicator) {
            const remainingDays = calculateRemainingDays(
              consulta.start_date,
              consulta.indicator
            );
            return { ...consulta, remaining_days: remainingDays };
          }
          return consulta;
        })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const consultasCercanas = consultas.filter(
      (consulta) => (consulta.remaining_days || consulta.indicator) <= 1
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

    const consultasNoAsignadas = consultas.filter(
      (consulta) =>
        (consulta.type === "No Asignado" || !consulta.type) &&
        (consulta.indicator === "No Asignado" || !consulta.indicator)
    ).length;

    if (consultasNoAsignadas > 0 && !unassignedAlertShown) {
      Swal.fire({
        title: "Alerta",
        text: `Hay ${consultasNoAsignadas} consultas que no se les ha asignado su tipo ni el número de días.`,
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      setUnassignedAlertShown(true);
    } else if (consultasNoAsignadas === 0) {
      setUnassignedAlertShown(false);
    }
  }, [consultas, alertShown, unassignedAlertShown]);

  const handleResponderConsulta = async (id) => {
    try {
      const consultaRef = doc(db, "Consults", id);
      await updateDoc(consultaRef, {
        status: "En proceso"
      });
      setConsultas(consultas.map(c =>
        c.id === id ? { ...c, status: "En proceso" } : c
      ));
      navigate(`/Respuestas/${id}`);
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      Swal.fire("Error", "No se pudo actualizar el estado de la consulta", "error");
    }
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
      setSelectedConsultId(null);
      setResolverDays(null);
    } else {
      const consulta = consultas.find((c) => c.id === id);
      setEditType(consulta.type || "No Asignado");
      setSelectedConsultId(id);
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
      const consultaRef = doc(db, "Consults", selectedConsultId);
      const now = new Date();
      const updateData = {
        type: editType,
        indicator: resolverDays,
        start_date: now,
        end_date: new Date(now.getTime() + resolverDays * 24 * 60 * 60 * 1000),
        remaining_days: resolverDays
      };
      await updateDoc(consultaRef, updateData);
      setConsultas(prevConsultas =>
        prevConsultas.map(consulta =>
          consulta.id === selectedConsultId
            ? { ...consulta, ...updateData }
            : consulta
        )
      );
      setExpandedRow(null);
      Swal.fire({
        title: "¡Éxito!",
        text: "La consulta ha sido actualizada correctamente",
        icon: "success",
        confirmButtonColor: "#1B5C94",
      });
    } catch (error) {
      console.error("Error al actualizar la consulta:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un error al actualizar la consulta",
        icon: "error",
        confirmButtonColor: "#1B5C94",
      });
    }
  };

  const renderRemainingDays = (consulta) => {
    if (!consulta.indicator && consulta.indicator !== 0) {
      return <Typography>No Asignado</Typography>;
    }
    const remainingDays = consulta.remaining_days !== undefined ?
      consulta.remaining_days :
      consulta.indicator;
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: remainingDays <= 1 ? "red" :
              remainingDays <= 3 ? "orange" : "green",
            mr: 1,
          }}
        />
        <Typography>
          {remainingDays} {remainingDays === 1 ? "Día" : "Días"}
        </Typography>
      </Box>
    );
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

  const handleIndicadorFilter = (value) => {
    setIndicadorFilter(value);
    setAnchorElIndicador(null);
  };

  const filteredConsultas = consultas
    .filter((consulta) => {
      const matchesType = !selectedType || consulta.type === selectedType;
      const matchesState = !selectedState || consulta.status === selectedState;
      const consultaDate = consulta.star_date?.toDate();
      const [startDate, endDate] = dateRange;
      const matchesDateRange =
        !startDate ||
        !endDate ||
        (consultaDate >= startDate && consultaDate <= endDate);
      let matchesIndicador = true;
      if (indicadorFilter !== "todos") {
        const remainingDays = consulta.remaining_days || consulta.indicator;
        switch (indicadorFilter) {
          case "urgente":
            matchesIndicador = remainingDays <= 1;
            break;
          case "proximo":
            matchesIndicador = remainingDays > 1 && remainingDays <= 3;
            break;
          case "normal":
            matchesIndicador = remainingDays > 3;
            break;
          case "no_asignado":
            matchesIndicador = !remainingDays && remainingDays !== 0;
            break;
        }
      }
      const matchesCompany = !searchCompany ||
        consulta.company.toLowerCase().includes(searchCompany.toLowerCase());
      return matchesType && matchesState && matchesDateRange && matchesIndicador && matchesCompany;
    })
    .sort((a, b) => {
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
    const iconProps = { sx: { color: "#1B5C94", fontSize: 24 } };
    switch (extension) {
      case "pdf":
        return <PictureAsPdfIcon {...iconProps} />;
      case "csv":
      case "xls":
      case "xlsx":
        return <TableChartIcon {...iconProps} />;
      case "doc":
      case "docx":
        return <DescriptionIcon {...iconProps} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon {...iconProps} />;
      default:
        return <InsertDriveFileIcon {...iconProps} />;
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
          justifyContent="space-between"
          sx={{
            p: 1,
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            mb: 1,
            "&:hover": { backgroundColor: "#f5f5f5" },
          }}
        >
          <Box display="flex" alignItems="center" gap={1} flexGrow={1}>
            {getFileIcon(fileName)}
            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
              {fileName}
            </Typography>
          </Box>
          {fileUrl && (
            <Tooltip title="Descargar archivo">
              <IconButton
                component="a"
                href={fileUrl}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: "#1B5C94" }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    });
  };

  const resetFilters = () => {
    setSelectedState("");
    setSelectedType("");
    setDateRange([null, null]);
    setIndicadorFilter("todos");
    setSearchCompany("");
  };

  const renderExpandedDetails = (consulta) => {
    return (
      <Card sx={{ m: 2, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#1B5C94", mb: 3 }}>
            Detalles de la Consulta
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '200px', backgroundColor: '#f5f5f5' }}>Nombre y Apellido</TableCell>
                  <TableCell>{consulta.name || "No disponible"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Correo</TableCell>
                  <TableCell>{consulta.email || "No disponible"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Empresa</TableCell>
                  <TableCell>{consulta.company || "No disponible"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Fecha de solicitud</TableCell>
                  <TableCell>
                    {consulta.timestamp?.seconds
                      ? new Date(consulta.timestamp.seconds * 1000).toLocaleString()
                      : "Fecha no disponible"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Consulta</TableCell>
                  <TableCell>{consulta.messageContent || "No disponible"}</TableCell>
                </TableRow>
                {consulta.attachment && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Archivo adjunto</TableCell>
                    <TableCell>
                      {renderAttachments(consulta.attachment)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 3, color: "#1B5C94" }}>
            Configuración de la Consulta
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Tipo de Consulta
              </Typography>
              <Select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                fullWidth
                size="small"
                sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}
              >
                <MuiMenuItem value="No Asignado">No Asignado</MuiMenuItem>
                <MuiMenuItem value="Asesoría técnica">Asesoría técnica</MuiMenuItem>
                <MuiMenuItem value="Clasificación arancelaria">
                  Clasificación arancelaria
                </MuiMenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Días para resolver consulta
              </Typography>
              <Select
                value={resolverDays === null ? "No Asignado" : resolverDays}
                onChange={(e) => {
                  const value = e.target.value === "No Asignado" ? null : e.target.value;
                  setResolverDays(value);
                }}
                fullWidth
                size="small"
                sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}
              >
                <MuiMenuItem value="No Asignado">No Asignado</MuiMenuItem>
                {[...Array(31).keys()].map((day) => (
                  <MuiMenuItem key={day} value={day}>
                    {day}
                  </MuiMenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: "#1B5C94",
                color: "white",
                borderRadius: "8px",
                padding: "8px 24px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#145a8c",
                },
              }}
            >
              Guardar
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Consultas
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
          <Tooltip title="Resetear filtros" arrow>
            <IconButton
              onClick={resetFilters}
              sx={{
                color: "#666",
                mr: 1,
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)"
                }
              }}
            >
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Salir al menú" arrow>
            <IconButton
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
                    navigate("/asesor-control");
                  }
                });
              }}
              sx={{
                color: "#1B5C94",
                "&:hover": {
                  backgroundColor: "rgba(27, 92, 148, 0.04)"
                }
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#1B5C94" }}>
              <TableCell>
                <Button
                  onClick={(event) => setAnchorElSearch(event.currentTarget)}
                  sx={{ color: "white", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <BusinessIcon sx={{ fontSize: 20 }} />
                  Cliente
                  {searchCompany && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#4CAF50",
                        display: "block"
                      }}
                    />
                  )}
                </Button>
                <Popover
                  open={Boolean(anchorElSearch)}
                  anchorEl={anchorElSearch}
                  onClose={() => setAnchorElSearch(null)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                >
                  <Box sx={{ p: 2, width: 250 }}>
                    <TextField
                      autoFocus
                      fullWidth
                      size="small"
                      variant="outlined"
                      placeholder="Buscar empresa..."
                      value={searchCompany}
                      onChange={(e) => setSearchCompany(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        endAdornment: searchCompany && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setSearchCompany("")}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Popover>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Button
                    onClick={(event) => setAnchorElTipo(event.currentTarget)}
                    sx={{ color: "white", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <CategoryIcon sx={{ fontSize: 20 }} />
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
                    <MuiMenuItem onClick={() => handleSelectType("")}>Todos</MuiMenuItem>
                    <MuiMenuItem onClick={() => handleSelectType("No Asignado")}>No Asignado</MuiMenuItem>
                    <MuiMenuItem onClick={() => handleSelectType("Asesoría técnica")}>Asesoría técnica</MuiMenuItem>
                    <MuiMenuItem onClick={() => handleSelectType("Clasificación arancelaria")}>Clasificación arancelaria</MuiMenuItem>
                  </Menu>
                </Box>
              </TableCell>
              <TableCell>
                <Button
                  onClick={(event) => setAnchorElFecha(event.currentTarget)}
                  sx={{ color: "white", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <CalendarTodayIcon sx={{ fontSize: 20 }} />
                  Fecha de Solicitud
                  {dateRange[0] && dateRange[1] && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#4CAF50",
                        display: "block"
                      }}
                    />
                  )}
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
                  PaperProps={{
                    sx: {
                      p: 2,
                      borderRadius: 2,
                      boxShadow: 3,
                      minWidth: '400px'
                    }
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateRangePicker
                      calendars={2}
                      value={dateRange}
                      onChange={(newValue) => {
                        setDateRange(newValue);
                        if (newValue[0] && newValue[1]) {
                          setTimeout(() => setAnchorElFecha(null), 300);
                        }
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: { width: '180px' }
                        },
                        fieldSeparator: {
                          children: 'hasta'
                        }
                      }}
                      localeText={{ start: 'Fecha inicial', end: 'Fecha final' }}
                    />
                  </LocalizationProvider>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDateRange([null, null]);
                        setAnchorElFecha(null);
                      }}
                      sx={{ color: '#666' }}
                    >
                      <FilterAltOffIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setAnchorElFecha(null)}
                      sx={{ color: '#1B5C94' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Popover>
              </TableCell>
              <TableCell>
                <Button
                  onClick={(event) => setAnchorElIndicador(event.currentTarget)}
                  sx={{ color: "white", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TimerIcon sx={{ fontSize: 20 }} />
                  Indicador
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: indicadorFilter === "todos" ? "transparent" :
                        indicadorFilter === "urgente" ? "red" :
                          indicadorFilter === "proximo" ? "orange" : "green",
                      display: indicadorFilter === "todos" ? "none" : "block"
                    }}
                  />
                </Button>
                <Popover
                  open={Boolean(anchorElIndicador)}
                  anchorEl={anchorElIndicador}
                  onClose={() => setAnchorElIndicador(null)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                >
                  <Box sx={{ p: 1 }}>
                    <MuiMenuItem onClick={() => handleIndicadorFilter("todos")}>
                      Todos
                    </MuiMenuItem>
                    <MuiMenuItem onClick={() => handleIndicadorFilter("urgente")}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "red"
                        }}
                      />
                      Urgente (1 día o menos)
                    </MuiMenuItem>
                    <MuiMenuItem onClick={() => handleIndicadorFilter("proximo")}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "orange"
                        }}
                      />
                      Próximo (2-3 días)
                    </MuiMenuItem>
                    <MuiMenuItem onClick={() => handleIndicadorFilter("normal")}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "green"
                        }}
                      />
                      Normal ( mayor a 3 días)
                    </MuiMenuItem>
                    <MuiMenuItem onClick={() => handleIndicadorFilter("no_asignado")}>
                      No Asignado
                    </MuiMenuItem>
                  </Box>
                </Popover>
              </TableCell>
              <TableCell>
                <Button
                  onClick={(event) => setAnchorElEstado(event.currentTarget)}
                  sx={{ color: "white", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AssignmentIcon sx={{ fontSize: 20 }} />
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
                  <MuiMenuItem onClick={() => handleSelectState("")}>Todos</MuiMenuItem>
                  <MuiMenuItem onClick={() => handleSelectState("Pendiente")}>Pendiente</MuiMenuItem>
                  <MuiMenuItem onClick={() => handleSelectState("En proceso")}>En proceso</MuiMenuItem>
                  <MuiMenuItem onClick={() => handleSelectState("Resuelto")}>Resuelto</MuiMenuItem>
                </Menu>
              </TableCell>
              <TableCell>
                <Button
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textTransform: 'none'
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 20 }} />
                  Historial
                </Button>
              </TableCell>

              

              <TableCell>
                <Button
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textTransform: 'none'
                  }}
                >
                  <CheckIcon sx={{ fontSize: 20 }} /> {/* Icono de check */}
                  Responder
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textTransform: 'none'
                  }}
                >
                  <ChatIcon sx={{ fontSize: 20 }} />
                  Comentario
                </Button>
              </TableCell>

              <TableCell>
                <Button
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textTransform: 'none'
                  }}
                >
                  Borrar
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredConsultas.map((consulta) => (
              <React.Fragment key={consulta.id}>
                <TableRow
                  onClick={(e) => {
                    if (
                      e.target.tagName !== "BUTTON" &&
                      !e.target.classList.contains("comment-button") &&
                      !e.target.classList.contains("view-comment-button") &&
                      !e.target.classList.contains("delete-button") &&
                      !e.target.classList.contains("historial-button") &&
                      !e.target.classList.contains("responder-button")
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
                    {renderRemainingDays(consulta)}
                  </TableCell>
                  <TableCell>{consulta.status}</TableCell>
                  <TableCell>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleHistorial(consulta.id);
                      }}
                      variant="contained"
                      sx={{
                        backgroundColor: "#1B5C94",
                        color: "white",
                        borderRadius: '8px',
                        padding: '6px 12px',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        minWidth: '100px',
                        '&:hover': {
                          backgroundColor: "#145a8c",
                        }
                      }}
                    >
                      Historial
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResponderConsulta(consulta.id);
                      }}
                      variant="contained"
                      sx={{
                        backgroundColor: "#1B5C94",
                        color: "white",
                        borderRadius: '8px', // Bordes cuadrados con suavizado
                        padding: '6px 12px',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        minWidth: '100px',
                        '&:hover': {
                          backgroundColor: "#145a8c",
                        }
                      }}
                    >
                      Responder
                    </Button>
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
                          {renderExpandedDetails(consulta)}
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
                              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "#1B5C94", mb: 3 }}>
                                Historial de Respuestas
                              </Typography>
                              {respuestas.length > 0 ? (
                                respuestas.map((respuesta) => (
                                  <Box key={respuesta.id} sx={{ mb: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
                                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                                      <Table>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', width: '200px', backgroundColor: '#f5f5f5' }}>Fecha</TableCell>
                                            <TableCell>
                                              {respuesta.timestamp?.seconds
                                                ? new Date(respuesta.timestamp.seconds * 1000).toLocaleString()
                                                : "Fecha no disponible"}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Respuesta</TableCell>
                                            <TableCell>{respuesta.content}</TableCell>
                                          </TableRow>
                                          {respuesta.attachment && (
                                            <TableRow>
                                              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Archivo adjunto</TableCell>
                                              <TableCell>
                                                {renderAttachments(respuesta.attachment)}
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </Box>
                                ))
                              ) : (
                                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                  No hay respuestas registradas para esta consulta.
                                </Typography>
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