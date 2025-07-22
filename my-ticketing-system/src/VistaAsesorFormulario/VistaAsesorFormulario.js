import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { getAuth } from "firebase/auth"; // Asegúrate de importar getAuth

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
  TextField,
  Badge,
  Checkbox,
} from "@mui/material";
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckIcon from "@mui/icons-material/Check";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ChatIcon from "@mui/icons-material/Chat";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import DownloadIcon from "@mui/icons-material/Download";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import LogoutIcon from "@mui/icons-material/Logout";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachFile as AttachFileIcon,
} from "@mui/icons-material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import TableChartIcon from "@mui/icons-material/TableChart";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  db,
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from "../firebaseConfig";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import "./VistaAsesorFormulario.css";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import InputAdornment from "@mui/material/InputAdornment";
import CategoryIcon from "@mui/icons-material/Category";
import TimerIcon from "@mui/icons-material/Timer";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { blue } from "@mui/material/colors";

/**
 * Componente que muestra la vista principal del asesor para gestionar las consultas.
 * Permite filtrar, ordenar y ver detalles de las consultas, así como responder y asignar tipos/estados.
 * @returns {JSX.Element} El elemento JSX que representa la vista del asesor.
 */
const VistaAsesorFormulario = () => {
  const [consultas, setConsultas] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [historialAbierto, setHistorialAbierto] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("start_date"); // Cambiado a "start_date"
  const [editType, setEditType] = useState("");
  const [selectedConsultId, setSelectedConsultId] = useState(null);
  const [resolverDays, setResolverDays] = useState(null);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [enProcesoCount, setEnProcesoCount] = useState(0);
  const [resueltasCount, setResueltasCount] = useState(0);
  const [resueltasFueraDeTiempoCount, setResueltasFueraDeTiempoCount] = useState(0);
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
  const [itemsCount, setItemsCount] = useState(null);
  const [tipoAsesoria, setTipoAsesoria] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const auth = getAuth();
  const [newResponsesCount, setNewResponsesCount] = useState(() => {
    const savedCounts = localStorage.getItem('responseCounts');
    return savedCounts ? JSON.parse(savedCounts) : {};
  });

  const navigate = useNavigate();
  const storage = getStorage();
  const clearDateFilter = () => {
    setFilterDate(null);
  };

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
    localStorage.setItem('responseCounts', JSON.stringify(newResponsesCount));
  }, [newResponsesCount]);
  useEffect(() => {
    const fetchAdvisorName = async () => {
      try {
        const user = auth.currentUser;
        if (user && user.email) {
          const advisorsRef = collection(db, "users");
          const q = query(advisorsRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const advisorData = querySnapshot.docs[0].data();
            setAdvisorName(advisorData.name || "");
          }
        }
      } catch (error) {
        console.error("Error al obtener el nombre del asesor:", error);
      }
    };

    fetchAdvisorName();
  }, [auth]);

  useEffect(() => {
    // Replace initial fetch with real-time listener on "consults"
const unsubscribeConsults = onSnapshot(collection(db, "Consults"), (querySnapshot) => {
      const consultasData = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        // Fix status logic: if status is "En proceso" but no type assigned or type is "No Asignado", set status to "Pendiente"
        let fixedStatus = data.status;
        if (
          data.status === "En proceso" &&
          (!data.type || data.type === "No Asignado")
        ) {
          fixedStatus = "Pendiente";
        }

        // Add new status "Resuelta fuera de tiempo" if status is "Resuelta" but remaining_days <= 0
        if (
          data.status === "Resuelta" &&
          data.indicator !== undefined &&
          data.indicator !== null &&
          data.indicator <= 0
        ) {
          fixedStatus = "Resuelta fuera de tiempo";
        }

        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp || data.apply_date || new Date(), // Ensure timestamp always present
          remaining_days: data.start_date
            ? calculateRemainingDays(data.start_date, data.indicator)
            : data.indicator,
          status: fixedStatus,
        };
      });
      setConsultas(consultasData);

      const pendientes = consultasData.filter(
        (c) => c.status === "Pendiente"
      ).length;
      const enProceso = consultasData.filter(
        (c) => c.status === "En proceso"
      ).length;
      const resueltas = consultasData.filter(
        (c) => c.status === "Resuelta"
      ).length;
      const resueltasFueraDeTiempo = consultasData.filter(
        (c) => c.status === "Resuelta fuera de tiempo"
      ).length;
      setPendientesCount(pendientes);
      setEnProcesoCount(enProceso);
      setResueltasCount(resueltas);
      setResueltasFueraDeTiempoCount(resueltasFueraDeTiempo);
    });

    // Configurar listeners para respuestas de clientes
    const unsubscribeResponses = onSnapshot(
      collection(db, "responsesClients"),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const newResponse = change.doc.data();
            try {
              const consultaRef = doc(db, "consults", newResponse.consultaId);
              const consultaDoc = await getDoc(consultaRef);

              if (!consultaDoc.exists()) {
                console.warn(`No existe la consulta con ID: ${newResponse.consultaId}`);
                return;
              }

              const consultaData = consultaDoc.data();
              const responseDate = newResponse.timestamp?.toDate?.();
              const lastViewedDate = consultaData.lastViewed?.toDate?.();

              if (!lastViewedDate || (responseDate && responseDate > lastViewedDate)) {
                setNewResponsesCount(prev => {
                  const newCount = (prev[newResponse.consultaId] || 0) + 1;
                  const newCounts = { ...prev, [newResponse.consultaId]: newCount };
                  localStorage.setItem('responseCounts', JSON.stringify(newCounts));
                  return newCounts;
                });
              }
            } catch (error) {
              console.error("Error al verificar estado de consulta:", error);
            }
          }
        });
      }
    );

    const interval = setInterval(() => {
      setConsultas((prevConsultas) =>
        prevConsultas.map((consulta) => {
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

    return () => {
      clearInterval(interval);
      unsubscribeResponses();
      unsubscribeConsults();
    };
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
      const consultaRef = doc(db, "consults", id);
      await updateDoc(consultaRef, {
        status: "En proceso",
      });
      setConsultas(
        consultas.map((c) => (c.id === id ? { ...c, status: "En proceso" } : c))
      );
      navigate(`/Respuestas/${id}`);
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      Swal.fire(
        "Error",
        "No se pudo actualizar el estado de la consulta",
        "error"
      );
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
      setItemsCount(null);
      setTipoAsesoria("");
    } else {
      const consulta = consultas.find((c) => c.id === id);
      setEditType(consulta.type || "No Asignado");
      setSelectedConsultId(id);
      setResolverDays(consulta.indicator || null);
      setItemsCount(consulta.itemsCount || null);
      setTipoAsesoria(consulta.tipoAsesoria || "");

      if (consulta.attachment) {
        const urls = await fetchDownloadUrls(consulta.attachment);
        setFileDownloadUrls((prevUrls) => ({ ...prevUrls, ...urls }));
      }
    }
  };

  const handleMarcarResuelta = async (id, currentStatus) => {
    const consulta = consultas.find(c => c.id === id);
    const hasTypeAssigned = consulta.type && consulta.type !== "No Asignado";

    // Fetch responses count from Firestore for the consulta
    let hasResponses = false;
    try {
      const respuestasRef = query(
        collection(db, "Responses"),
        where("consultaId", "==", id)
      );
      const respuestasSnapshot = await getDocs(respuestasRef);
      if (!respuestasSnapshot.empty) {
        hasResponses = true;
      }
    } catch (error) {
      console.error("Error fetching responses count:", error);
      // Assume no responses if error occurs
      hasResponses = false;
    }

    if (!hasTypeAssigned || !hasResponses) {
      Swal.fire({
        title: "No se puede marcar como resuelta",
        text: "No puede marcar como resuelta una consulta sin tipo asignado o sin respuestas.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    const isResuelta = currentStatus === "Resuelta" || currentStatus === "Resuelta fuera de tiempo";
    const { isConfirmed } = await Swal.fire({
      title: isResuelta ? "Desmarcar como resuelta" : "Confirmar",
      text: isResuelta
        ? "¿Estás seguro de que deseas desmarcar esta consulta como resuelta?"
        : "¿Estás seguro de que deseas marcar esta consulta como resuelta?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isResuelta ? "Sí, desmarcar" : "Sí, marcar como resuelta",
      cancelButtonText: "Cancelar",
      confirmButtonColor: isResuelta ? "#FF9800" : "#4CAF50",
    });

    if (isConfirmed) {
      try {
        const consultaRef = doc(db, "consults", id);

        // Calcular remaining_days basado en la fecha actual
        const remainingDays = consulta.start_date
          ? calculateRemainingDays(consulta.start_date, consulta.indicator)
          : consulta.indicator;

        // Determine new status considering "Resuelta fuera de tiempo"
        let newStatus;
        if (isResuelta) {
          newStatus = "En proceso";
        } else {
          newStatus = remainingDays <= 0 ? "Resuelta fuera de tiempo" : "Resuelta";
        }

        const updateData = {
          status: newStatus,
          remaining_days: remainingDays, // Actualizar remaining_days
          ...(isResuelta ? {} : { resolvedAt: new Date() })
        };

        await updateDoc(consultaRef, updateData);

        // Actualizar el estado local
        setConsultas(consultas.map(c =>
          c.id === id ? { ...c, status: newStatus, remaining_days: remainingDays } : c
        ));

        // Resto de tu lógica para actualizar contadores...
      } catch (error) {
        console.error("Error al actualizar el estado:", error);
        Swal.fire(
          "Error",
          `No se pudo ${isResuelta ? "desmarcar" : "marcar"} la consulta`,
          "error"
        );
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
      // Marcar como leído en Firebase
      try {
        const consultaRef = doc(db, "consults", id);
        await updateDoc(consultaRef, {
          lastViewed: new Date()
        });
      } catch (error) {
        console.error("Error al actualizar la fecha de visualización:", error);
      }

      await obtenerRespuestas(id);
      setHistorialAbierto(id);

      // Resetear el contador local
      setNewResponsesCount(prev => {
        const newCounts = { ...prev, [id]: 0 };
        localStorage.setItem('responseCounts', JSON.stringify(newCounts));
        return newCounts;
      });
    }
  };

  const obtenerRespuestas = async (consultaId) => {
    try {
          const respuestasRef = query(
            collection(db, "responses"),
            where("consultaId", "==", consultaId)
          );
          const respuestasSnapshot = await getDocs(respuestasRef);
      const respuestasData = respuestasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const respuestasClienteRef = query(
        collection(db, "responsesClients"),
        where("consultaId", "==", consultaId)
      );
      const respuestasClienteSnapshot = await getDocs(respuestasClienteRef);
      const respuestasClienteData = respuestasClienteSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

      // Fetch download URLs for client responses attachments
      let clientAttachmentUrls = {};
      for (const respuesta of respuestasClienteData) {
        if (respuesta.attachment) {
          const urls = await fetchDownloadUrls(respuesta.attachment);
          clientAttachmentUrls = { ...clientAttachmentUrls, ...urls };
        }
      }

      const respuestas1 = [...respuestasClienteData];
      const respuestas2 = [...respuestasData];

      respuestas1.forEach((item) => {
        item["sender"] = "Cliente";
        return item;
      });

      respuestas2.forEach((item) => {
        item["sender"] = "Tú";
        return item;
      });

      const mergedArray = respuestas1.concat(respuestas2);
      mergedArray.sort((a, b) => {
        return b.timestamp.seconds - a.timestamp.seconds;
      });

      setRespuestas(mergedArray);

      // Update fileDownloadUrls state with client attachment URLs
      setFileDownloadUrls((prevUrls) => ({ ...prevUrls, ...clientAttachmentUrls }));
    } catch (error) {
      console.error("Error al obtener las respuestas:", error);
    }
  };

  const fetchDownloadUrls = async (attachments) => {
    const urls = {};

    // Si attachments es un string, lo convertimos a array
    const files = typeof attachments === 'string' ?
      attachments.split(", ") :
      Array.isArray(attachments) ? attachments : [];

    for (const fileReference of files) {
      try {
        // Si ya es una URL completa, la usamos directamente
        if (fileReference.startsWith('http')) {
          urls[fileReference] = {
            url: fileReference,
            displayName: fileReference.split('/').pop().split('?')[0]
          };
          continue;
        }

        // Manejar diferentes formatos de referencia de archivo
        let storagePath = fileReference;

        if (fileReference.startsWith('archivos/')) {
          storagePath = fileReference;
        }
        // Si es solo un nombre de archivo, asumimos que está en 'archivos/'
        else {
          storagePath = `archivos/${fileReference.split('/').pop()}`;
        }

        const storageRef = ref(storage, storagePath);
        const url = await getDownloadURL(storageRef);

        urls[fileReference] = {
          url: url,
          displayName: storagePath.split('/').pop()
        };
      } catch (error) {
        console.error("Error al obtener la URL de descarga:", error);
        // Si falla, al menos mostramos el nombre del archivo
        urls[fileReference] = {
          url: null,
          displayName: fileReference.split('/').pop()
        };
      }
    }
    return urls;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Fecha no disponible";

    // Si es un objeto de Firestore Timestamp
    if (timestamp.seconds) {
      return moment(timestamp.seconds * 1000)
        .tz("America/Caracas")
        .format("DD MMM YYYY, HH:mm");
    }

    // Si ya es una fecha (puede ser el caso cuando se actualiza)
    if (timestamp instanceof Date) {
      return moment(timestamp)
        .tz("America/Caracas")
        .format("DD MMM YYYY, HH:mm");
    }

    // Si es un string ISO (por si acaso)
    if (typeof timestamp === 'string') {
      return moment(timestamp)
        .tz("America/Caracas")
        .format("DD MMM YYYY, HH:mm");
    }

    return "Fecha no disponible";
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSave = async () => {
    // Validation for required fields based on type
    if (!editType || editType.trim() === "") {
      Swal.fire({
        title: "Aviso",
        text: "Debe seleccionar un tipo de consulta antes de guardar.",
        icon: "warning",
        confirmButtonColor: "#1B5C94",
      });
      return;
    }
    if (editType === "Asesoría técnica" && (!tipoAsesoria || tipoAsesoria.trim() === "")) {
      Swal.fire({
        title: "Aviso",
        text: "Debe asignar un tipo de asesoría antes de guardar.",
        icon: "warning",
        confirmButtonColor: "#1B5C94",
      });
      return;
    }
    if (editType === "Clasificación arancelaria" && (!itemsCount || itemsCount <= 0)) {
      Swal.fire({
        title: "Aviso",
        text: "Debe asignar la cantidad de ítems a clasificar antes de guardar.",
        icon: "warning",
        confirmButtonColor: "#1B5C94",
      });
      return;
    }

    try {
      let daysToResolve = resolverDays;

      // Lógica para determinar días automáticos según tipo de consulta
      if (editType === "Clasificación arancelaria" && itemsCount !== null) {
        daysToResolve = itemsCount < 10 ? 2 : 10;
      } else if (editType === "Asesoría técnica" && tipoAsesoria) {
        daysToResolve = tipoAsesoria === "Interna" ? 2 : 10;
      }

      const consultaRef = doc(db, "consults", selectedConsultId);
      const now = new Date();
      const updateData = {
        type: editType,
        indicator: daysToResolve,
        start_date: now,
        end_date: new Date(now.getTime() + daysToResolve * 24 * 60 * 60 * 1000),
        remaining_days: daysToResolve,
        itemsCount:
          editType === "Clasificación arancelaria" ? itemsCount : null,
        tipoAsesoria: editType === "Asesoría técnica" ? tipoAsesoria : null,
      };

      await updateDoc(consultaRef, updateData);
      setConsultas((prevConsultas) =>
        prevConsultas.map((consulta) =>
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
      return <Typography sx={{ textAlign: "left" }}>No Asignado</Typography>;
    }

    const remainingDays =
      consulta.remaining_days !== undefined
        ? consulta.remaining_days
        : consulta.indicator;

    // Si la consulta está resuelta
    if (consulta.status === "Resuelta" || consulta.status === "Resuelta fuera de tiempo") {
      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: remainingDays > 0 ? "green" : "orange",
              mr: 1,
            }}
          />
          <Typography sx={{ color: remainingDays > 0 ? "success.main" : "black" }}>
            {remainingDays > 0 ? "Resuelta a tiempo" : "Resuelta fuera de tiempo"}
          </Typography>
        </Box>
      );
    }

    // Si la consulta no está resuelta
    const isOverdue = remainingDays <= 0;

    let plazoInfo = "";
    if (consulta.type === "Clasificación arancelaria" && consulta.itemsCount) {
      plazoInfo = ` (${consulta.itemsCount < 10 ? "Rápida" : "Estándar"})`;
    } else if (consulta.type === "Asesoría técnica" && consulta.tipoAsesoria) {
      plazoInfo = ` (${consulta.tipoAsesoria})`;
    }

    return (
      <Box sx={{ display: "flex", alignItems: "center", textAlign: "left", width: "100%" }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: isOverdue
              ? "red"
              : remainingDays <= 1
                ? "red"
                : remainingDays <= 3
                  ? "orange"
                  : "green",
            mr: 1,
          }}
        />
        <Typography sx={{ color: isOverdue ? "error.main" : "inherit", textAlign: "left", flexGrow: 1 }}>
          {isOverdue ? "0" : remainingDays} {remainingDays === 1 ? "Día" : "Días"}
          {plazoInfo}
          {isOverdue && " (Fuera de tiempo)"}
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
      try {
        const consultaRef = doc(db, "consults", id);
        await updateDoc(consultaRef, { comentario: comment });

        // Actualizar el estado local inmediatamente
        setConsultas(consultas.map((c) =>
          c.id === id ? { ...c, comentario: comment } : c
        ));

        Swal.fire({
          title: "¡Comentario guardado!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error("Error al guardar el comentario:", error);
        Swal.fire("Error", "No se pudo guardar el comentario", "error");
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
          const consultaRef = doc(db, "consults", id);
          await updateDoc(consultaRef, { comentario: "" });
          setConsultas(
            consultas.map((c) => (c.id === id ? { ...c, comentario: "" } : c))
          );
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
        const consultaRef = doc(db, "consults", id);
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
      const matchesType =
        !selectedType ||
        (selectedType === "No Asignado"
          ? !consulta.type || consulta.type === "No Asignado"
          : consulta.type === selectedType);
      const matchesState =
        !selectedState ||
        (selectedState === "Resuelta fuera de tiempo"
          ? consulta.status === "Resuelta fuera de tiempo"
          : consulta.status === selectedState);
      const consultaDate = consulta.start_date
        ? typeof consulta.start_date.toDate === "function"
          ? consulta.start_date.toDate()
          : new Date(consulta.start_date)
        : null;
      const [startDate, endDate] = dateRange;
      const matchesDateRange =
        !startDate ||
        !endDate ||
        (consultaDate >= startDate && consultaDate <= endDate);

      let matchesIndicador = true;
      if (indicadorFilter !== "todos") {
        const remainingDays = consulta.remaining_days !== undefined ?
          consulta.remaining_days :
          consulta.indicator;

        switch (indicadorFilter) {
          case "urgente":
            matchesIndicador = remainingDays <= 1 && remainingDays > 0;
            break;
          case "proximo":
            matchesIndicador = remainingDays > 1 && remainingDays <= 3;
            break;
          case "normal":
            matchesIndicador = remainingDays > 3 && consulta.status !== "Resuelta";
            break;
          case "no_asignado":
            // Consultas sin indicador asignado
            matchesIndicador = (
              consulta.indicator === undefined ||
              consulta.indicator === null ||
              consulta.indicator === "No Asignado" ||
              consulta.indicator === "" ||
              isNaN(consulta.indicator)
            );
            break;
          case "fuera_tiempo":
            // Consultas con indicador 0 o remaining_days 0
            matchesIndicador = (
              (consulta.indicator === 0 ||
                consulta.remaining_days === 0) &&
              consulta.status !== "Resuelta" &&
              consulta.status !== "Resuelta fuera de tiempo"
            );
            break;
          default:
            matchesIndicador = true;
            break;
        }
      }

const matchesCompany =
        !searchCompany ||
        (consulta.companyName && consulta.companyName.toLowerCase().includes(searchCompany.toLowerCase()));

      return (
        matchesType &&
        matchesState &&
        matchesDateRange &&
        matchesIndicador &&
        matchesCompany
      );
    })
    .sort((a, b) => {
      // Primero, mantener la lógica de ordenamiento por columnas cuando se hace click en los headers
      if (orderBy === "status") {
        const statesOrder = ["Pendiente", "En proceso", "Resuelta", "Resuelta fuera de tiempo"];
        const aPriority = a.status === selectedState ? -1 : statesOrder.indexOf(a.status);
        const bPriority = b.status === selectedState ? -1 : statesOrder.indexOf(b.status);
        return order === "asc" ? aPriority - bPriority : bPriority - aPriority;
      }
      if (orderBy === "apply_date") {
        return order === "asc"
          ? (a.start_date?.seconds || 0) - (b.start_date?.seconds || 0)
          : (b.start_date?.seconds || 0) - (a.start_date?.seconds || 0);
      }
      if (orderBy === "type") {
        const typesOrder = [
          "Clasificación Arancelaria",
          "Asesoría técnica",
          "No Asignado",
        ];
        const aIndex = typesOrder.indexOf(a.type || "No Asignado");
        const bIndex = typesOrder.indexOf(b.type || "No Asignado");
        return order === "asc" ? aIndex - bIndex : bIndex - aIndex;
      }

      // Ordenar por fecha de solicitud descendente (más reciente primero) por defecto
      const aDate = a.start_date?.seconds ? a.start_date.seconds * 1000 :
        a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0;
      const bDate = b.start_date?.seconds ? b.start_date.seconds * 1000 :
        b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0;
      return bDate - aDate; // Orden descendente (más reciente primero)
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
    if (!attachments) return null;

    const files = typeof attachments === 'string' ?
      attachments.split(", ") :
      Array.isArray(attachments) ? attachments : [];

    return files.map((fileReference) => {
      // Obtener la URL de descarga si existe
      const fileUrl = fileDownloadUrls[fileReference]?.url || fileReference;
      // Obtener el nombre legible del archivo
      const displayName = fileDownloadUrls[fileReference]?.displayName ||
        fileReference.split('/').pop() ||
        fileReference;

      return (
        <Box
          key={fileReference}
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
            {getFileIcon(displayName)}
            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
              {displayName}
            </Typography>
          </Box>
          {fileUrl && (
            <Tooltip title="Descargar archivo">
              <IconButton
                component="a"
                href={fileUrl}
                download={displayName}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: "#1B5C94" }}
                onClick={(e) => e.stopPropagation()}
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
  const filterButtonStyle = {
    color: "white",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: 1,
    '&:hover': {
      backgroundColor: "rgba(255, 255, 255, 0.15)", // Sutil brillo blanco
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      transform: "translateY(-1px)",
      transition: "all 0.2s ease",
    },
    '&:active': {
      transform: "translateY(0)",
    }
  };
  const filteredResponses = filterDate
    ? respuestas.filter((response) => {
      if (!response.timestamp?.seconds) return false;

      const responseDate = new Date(response.timestamp.seconds * 1000);
      const filterDay = filterDate ? filterDate.toDate() : null;

      if (!filterDay) return true;

      return (
        responseDate.getDate() === filterDay.getDate() &&
        responseDate.getMonth() === filterDay.getMonth() &&
        responseDate.getFullYear() === filterDay.getFullYear()
      );
    })
    : respuestas;

  const renderExpandedDetails = (consulta) => {
    return (
      <Card sx={{ m: 2, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#1B5C94", mb: 3 }}
          >
            Detalles de la Consulta
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      width: "200px",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    Nombre y Apellido
                  </TableCell>
                  <TableCell>{consulta.name || "No disponible"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
                  >
                    Correo
                  </TableCell>
                  <TableCell>{consulta.email || "No disponible"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
                  >
                    Empresa
                  </TableCell>
                  <TableCell>{consulta.companyName || "No disponible"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
                  >
                    Fecha de solicitud
                  </TableCell>
                  <TableCell>
                    {consulta.timestamp?.seconds
                      ? new Date(
                        consulta.timestamp.seconds * 1000
                      ).toLocaleString()
                      : ""}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
                  >
                    Consulta
                  </TableCell>
                  <TableCell>
                    {consulta.messageContent || "No disponible"}
                  </TableCell>
                </TableRow>
                {consulta.attachment && (
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
                    >
                      Archivo adjunto
                    </TableCell>
                    <TableCell>
                      {renderAttachments(consulta.attachment)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography
            variant="h6"
            fontWeight="bold"
            gutterBottom
            sx={{ mt: 3, color: "#1B5C94" }}
          >
            Configuración de la Consulta
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Tipo de Consulta
              </Typography>
              <Select
                value={editType}
                onChange={(e) => {
                  setEditType(e.target.value);
                  // Resetear campos relacionados al cambiar el tipo
                  if (e.target.value !== "Clasificación arancelaria")
                    setItemsCount(null);
                  if (e.target.value !== "Asesoría técnica")
                    setTipoAsesoria("");
                }}
                fullWidth
                size="small"
                sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}
              >
                <MuiMenuItem value="">Seleccione...</MuiMenuItem>
                <MuiMenuItem value="Asesoría técnica">
                  Asesoría técnica
                </MuiMenuItem>
                <MuiMenuItem value="Clasificación arancelaria">
                  Clasificación arancelaria
                </MuiMenuItem>
              </Select>
            </Grid>

            {/* Campo para cantidad de ítems (solo visible para clasificación arancelaria) */}
            {editType === "Clasificación arancelaria" && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Cantidad de ítems a clasificar
                </Typography>
                <TextField
                  type="number"
                  value={itemsCount || ""}
                  onChange={(e) =>
                    setItemsCount(parseInt(e.target.value) || null)
                  }
                  fullWidth
                  size="small"
                  sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}
                  inputProps={{ min: 1 }}
                />
                {itemsCount !== null && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: "block", color: "#1B5C94" }}
                  >
                    Plazo automático: {itemsCount < 10 ? "2 días" : "10 días"}
                  </Typography>
                )}
              </Grid>
            )}

            {/* Campo para tipo de asesoría (solo visible para asesoría técnica) */}
            {editType === "Asesoría técnica" && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Tipo de Asesoría
                </Typography>
                <Select
                  value={tipoAsesoria}
                  onChange={(e) => setTipoAsesoria(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}
                >
                  <MuiMenuItem value="">Seleccione...</MuiMenuItem>
                  <MuiMenuItem value="Interna">
                    Interna (2 días hábiles)
                  </MuiMenuItem>
                  <MuiMenuItem value="Externa">
                    Externa (10 días hábiles)
                  </MuiMenuItem>
                </Select>
                {tipoAsesoria && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: "block", color: "#1B5C94" }}
                  >
                    Plazo automático:{" "}
                    {tipoAsesoria === "Interna" ? "2 días" : "10 días"}
                  </Typography>
                )}
              </Grid>
            )}

            {/* Mostrar días asignados (solo cuando no es automático) */}
            {editType !== "Clasificación arancelaria" &&
              editType !== "Asesoría técnica" && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Días para resolver consulta
                  </Typography>
                  <Select
                    value={resolverDays === null ? "No Asignado" : resolverDays}
                    onChange={(e) => {
                      const value =
                        e.target.value === "No Asignado"
                          ? null
                          : e.target.value;
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
              )}
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", }}>
        <Box sx={{ textAlign: 'left' }}>
          {advisorName && (
            <Typography variant="h5" fontWeight="bold" color="#1B5C94" gutterBottom>
              Bienvenido, {advisorName}
            </Typography>
          )}
        </Box>

        {/* Segunda fila: Consultas centrado */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="bold" color="#1B5C94" gutterBottom>
            Consultas
          </Typography>
        </Box>
        <Tooltip title="Resetear filtros" arrow>
          <IconButton
            onClick={resetFilters}
            sx={{
              color: "#1B5C94",
              "&:hover": {
                backgroundColor: "rgba(27, 92, 148, 0.1)",
              },
            }}
          >
            <RestartAltIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Grid container spacing={2} mt={.5} mb={2}>
        <Grid item xs={12} md={3}>
          <Card sx={{ boxShadow: 3, color: "#1B5C94" }} >
            <CardContent>
              <Typography variant="h6" fontWeight="bold" >
                CONSULTAS PENDIENTES:
              </Typography>
              <Typography variant="h4" color="error">
                {pendientesCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ boxShadow: 3, color: "#1B5C94" }}>
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
        <Grid item xs={12} md={3}>
          <Card sx={{ boxShadow: 3, color: "#1B5C94" }}>
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
        <Grid item xs={12} md={3}>
          <Card sx={{ boxShadow: 3, color: "#1B5C94" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                RESUELTAS FUERA DE TIEMPO:
              </Typography>
              <Typography variant="h4" color="warning.main">
                {resueltasFueraDeTiempoCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#1B5C94" }}>
              <TableCell>
                <Button
                  onClick={(event) => setAnchorElSearch(event.currentTarget)}
                  sx={filterButtonStyle}
                >
                  <BusinessIcon sx={{ fontSize: 20 }} />
                  Cliente
                  <SearchIcon
                    sx={{
                      transform: orderBy === "status"
                        ? order === "asc" ? "rotate(0deg)" : "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                      fontSize: 16,
                    }}
                  />
                  {searchCompany && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#4CAF50",
                        display: "block",
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
                    sx={filterButtonStyle}
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
                    <MuiMenuItem onClick={() => handleSelectType("")}>
                      Todos
                    </MuiMenuItem>
                    <MuiMenuItem
                      onClick={() => handleSelectType("No Asignado")}
                    >
                      No Asignado
                    </MuiMenuItem>
                    <MuiMenuItem
                      onClick={() => handleSelectType("Asesoría técnica")}
                    >
                      Asesoría técnica
                    </MuiMenuItem>
                    <MuiMenuItem
                      onClick={() =>
                        handleSelectType("Clasificación arancelaria")
                      }
                    >
                      Clasificación arancelaria
                    </MuiMenuItem>
                  </Menu>
                </Box>
              </TableCell>
              <TableCell>
                <Button
                  onClick={(event) => setAnchorElFecha(event.currentTarget)}
                  sx={filterButtonStyle}
                >
                  <CalendarTodayIcon sx={{ fontSize: 20 }} />
                  Fecha de Solicitud
                  <ExpandMoreIcon
                    sx={{
                      transform: orderBy === "status"
                        ? order === "asc" ? "rotate(0deg)" : "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                      fontSize: 16,
                    }}
                  />
                  {dateRange[0] && dateRange[1] && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#4CAF50",
                        display: "block",
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
                      minWidth: "400px",
                    },
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
                          sx: { width: "180px" },
                        },
                        fieldSeparator: {
                          children: "hasta",
                        },
                      }}
                      localeText={{
                        start: "Fecha inicial",
                        end: "Fecha final",
                      }}
                    />
                  </LocalizationProvider>
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDateRange([null, null]);
                        setAnchorElFecha(null);
                      }}
                      sx={{ color: "#666" }}
                    >
                      <FilterAltOffIcon />
                    </IconButton>
                  </Box>
                </Popover>
              </TableCell>
              <TableCell>
                <Button
                  onClick={(event) => setAnchorElIndicador(event.currentTarget)}
                  sx={filterButtonStyle}
                >
                  <TimerIcon sx={{ fontSize: 20 }} />
                  Indicador
                  <ExpandMoreIcon
                    sx={{
                      transform: orderBy === "status"
                        ? order === "asc" ? "rotate(0deg)" : "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                      fontSize: 16,
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        indicadorFilter === "todos"
                          ? "transparent"
                          : indicadorFilter === "urgente"
                            ? "red"
                            : indicadorFilter === "proximo"
                              ? "orange"
                              : "green",
                      display: indicadorFilter === "todos" ? "none" : "block",
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
                    <MuiMenuItem
                      onClick={() => handleIndicadorFilter("no_asignado")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "gray",
                        }}
                      />
                      No asignado (sin días asignados)
                    </MuiMenuItem>
                    <MuiMenuItem
                      onClick={() => handleIndicadorFilter("urgente")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "red",
                        }}
                      />
                      Urgente (1 día)
                    </MuiMenuItem>
                    <MuiMenuItem
                      onClick={() => handleIndicadorFilter("proximo")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "orange",
                        }}
                      />
                      Próximo (2-3 días)
                    </MuiMenuItem>
                    <MuiMenuItem
                      onClick={() => handleIndicadorFilter("normal")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "green",
                        }}
                      />
                      Normal ( mayor a 3 días)
                    </MuiMenuItem>

                    <MuiMenuItem
                      onClick={() => handleIndicadorFilter("fuera_tiempo")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "yellow",
                        }}
                      />
                      Fuera de tiempo (0 días, no resueltas)
                    </MuiMenuItem>
                  </Box>
                </Popover>
              </TableCell>
              <TableCell align="center">
                <Box display="flex" justifyContent="center">
                  <Button
                    onClick={(event) => setAnchorElEstado(event.currentTarget)}
                    sx={filterButtonStyle}
                  >
                    <AssignmentIcon sx={{ fontSize: 20 }} />
                    ESTADO
                    <ExpandMoreIcon
                      sx={{
                        transform: orderBy === "status"
                          ? order === "asc" ? "rotate(0deg)" : "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                        fontSize: 16,
                      }}
                    />
                  </Button>
                </Box>
                <Menu
                  id="state-menu"
                  anchorEl={anchorElEstado}
                  open={Boolean(anchorElEstado)}
                  onClose={() => setAnchorElEstado(null)}
                >
                  <MuiMenuItem onClick={() => handleSelectState("")}>Todos</MuiMenuItem>
                  <MuiMenuItem onClick={() => handleSelectState("Pendiente")}>Pendiente</MuiMenuItem>
                  <MuiMenuItem onClick={() => handleSelectState("En proceso")}>En proceso</MuiMenuItem>
                  <MuiMenuItem onClick={() => handleSelectState("Resuelta")}>Resuelta</MuiMenuItem>
                  <MuiMenuItem onClick={() => handleSelectState("Resuelta fuera de tiempo")}>Resuelta fuera de tiempo</MuiMenuItem>
                </Menu>
              </TableCell>
              <TableCell align="center">
                <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                  <HistoryIcon sx={{ fontSize: 20, color: "white" }} />
                  <Typography variant="subtitle2" color="white" fontWeight="bold">
                    HISTORIAL
                  </Typography>
                </Box>
              </TableCell>

              <TableCell align="center">
                <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                  <AssignmentTurnedInIcon sx={{ fontSize: 20, color: "white" }} />
                  <Typography variant="subtitle2" color="white" fontWeight="bold">
                    RESPONDER
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                  <ChatIcon sx={{ fontSize: 20, color: "white" }} />
                  <Typography variant="subtitle2" color="white" fontWeight="bold">
                    COMENTARIO
                  </Typography>
                </Box>
              </TableCell>

              <TableCell align="center">
                <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                  <CheckIcon sx={{ fontSize: 20, color: "white" }} />
                  <Typography variant="subtitle2" color="white" fontWeight="bold">
                    RESUELTA
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredConsultas.map((consulta) => (
              <React.Fragment key={consulta.id}>
                {/* Este es el TableRow que debes modificar */}
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
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                    backgroundColor:
                      (!consulta.type || consulta.type.trim().toLowerCase() === "no asignado")
                        ? "rgba(255, 0, 0, 0.1)" // Fondo rojo claro para consultas sin tipo
                        : (consulta.status === "Resuelta fuera de tiempo")
                          ? "rgba(255, 255, 0, 0.2)"
                          : (consulta.status === "Resuelta" && consulta.remaining_days > 0)
                            ? "rgba(0, 128, 0, 0.15)"
                            : (consulta.remaining_days < 0 && consulta.status !== "Resuelta" && consulta.status !== "Resuelta fuera de tiempo")
                              ? "rgba(255, 0, 0, 0.1)"
                              : "inherit",
                    borderLeft:
                      (!consulta.type || consulta.type.trim().toLowerCase() === "no asignado")
                        ? "4px solid red" // Borde izquierdo rojo para consultas sin tipo
                        : (consulta.status === "Resuelta fuera de tiempo")
                          ? "4px solid #FFD700"
                          : (consulta.status === "Resuelta" && consulta.remaining_days > 0)
                            ? "4px solid green"
                            : (consulta.remaining_days < 0 && consulta.status !== "Resuelta" && consulta.status !== "Resuelta fuera de tiempo")
                              ? "4px solid red"
                              : "none"
                  }}
                >
                  <TableCell>{consulta.companyName}</TableCell>
                  <TableCell>{consulta.type || "No Asignado"}</TableCell>
                  <TableCell align="center">{formatDateTime(consulta.start_date || consulta.timestamp || consulta.apply_date)}</TableCell>
                  <TableCell align="center">{renderRemainingDays(consulta)}</TableCell>
                  <TableCell align="center">{consulta.status}</TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center">
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleHistorial(consulta.id);
                          }}
                          variant="contained"
                          sx={{
                            backgroundColor: "#1B5C94",
                            color: "white",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            textTransform: "none",
                            fontWeight: "bold",
                            minWidth: "100px",
                            "&:hover": {
                              backgroundColor: "#145a8c",
                            },
                          }}
                        >
                          Historial
                        </Button>
                        <Badge
                          badgeContent={newResponsesCount[consulta.id] || 0}
                          color="error"
                          sx={{
                            position: 'absolute',
                            top: -5,
                            right: -3,
                            '& .MuiBadge-badge': {
                              height: '20px',
                              minWidth: '20px',
                              borderRadius: '50%',
                              transform: 'scale(1) translate(50%, -50%)',
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResponderConsulta(consulta.id);
                        }}
                        variant="contained"
                        sx={{
                          backgroundColor: "#1B5C94",
                          color: "white",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          textTransform: "none",
                          fontWeight: "bold",
                          minWidth: "100px",
                          "&:hover": {
                            backgroundColor: "#145a8c",
                          },
                        }}
                      >
                        Responder
                      </Button>
                    </Box>
                  </TableCell>
                  {/* Para la celda de encabezado */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                      {/* Botón para agregar comentario */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCommentClick(consulta.id);
                        }}
                        sx={{ minWidth: 0, p: 0 }}
                      >
                        <ChatIcon sx={{ color: "#1B5C94" }} />
                      </Button>

                      {/* Botón para ver comentario con notificación */}
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewComment(consulta.id);
                          }}
                          sx={{ minWidth: 0, p: 0 }}
                        >
                          <VisibilityIcon sx={{ color: "#1B5C94" }} />
                        </Button>
                        {consulta.comentario && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: 'red',
                              border: '2px solid white'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" alignItems="center">
                      <Checkbox
                        checked={consulta.status === "Resuelta" || consulta.status === "Resuelta fuera de tiempo"}
                        onChange={() => handleMarcarResuelta(consulta.id, consulta.status)}
                        onClick={(e) => e.stopPropagation()}
                        icon={consulta.status === "Resuelta fuera de tiempo" ? <WarningAmberIcon sx={{ color: "orange", fontSize: 28 }} /> : undefined}
                        checkedIcon={consulta.status === "Resuelta fuera de tiempo" ? <WarningAmberIcon sx={{ color: "orange", fontSize: 28 }} /> : undefined}
                        sx={{
                          color: "#1B5C94",
                          '&.Mui-checked': {
                            color: "#4CAF50",
                          },
                        }}
                      />
                    </Box>
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
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={3}
                              >
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  sx={{ color: "#1B5C94" }}
                                >
                                  Historial de Respuestas
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                      label="Filtrar por fecha"
                                      value={filterDate}
                                      onChange={(newValue) => setFilterDate(newValue)}
                                      slotProps={{
                                        textField: {
                                          size: "small",
                                          sx: { width: 180 },
                                          InputProps: {
                                            startAdornment: <CalendarIcon sx={{ mr: 1 }} />,
                                          },
                                        },
                                      }}
                                    />
                                  </LocalizationProvider>
                                  {filterDate && (
                                    <IconButton
                                      onClick={clearDateFilter}
                                      sx={{ color: "error.main" }}
                                    >
                                      <ClearIcon />
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                              {filteredResponses.length > 0 ? (
                                filteredResponses.map((respuesta) => (
                                  <Box
                                    key={respuesta.id}
                                    backgroundColor={
                                      respuesta.sender === "Cliente"
                                        ? "#DDDDDD33"
                                        : "#C4E4FF88"
                                    }
                                    sx={{
                                      mb: 3,
                                      p: 2,
                                      border: "1px solid #e0e0e0",
                                      borderRadius: 2,
                                    }}
                                  >
                                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                                      <Table>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell
                                              sx={{
                                                fontWeight: "bold",
                                                width: "200px",
                                                backgroundColor: "#f5f5f5",
                                              }}
                                            >
                                              Fecha
                                            </TableCell>
                                            <TableCell>
                                              {respuesta.timestamp?.seconds
                                                ? new Date(
                                                  respuesta.timestamp.seconds * 1000
                                                ).toLocaleString()
                                                : "Fecha no disponible"}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell
                                              sx={{
                                                fontWeight: "bold",
                                                backgroundColor: "#f5f5f5",
                                              }}
                                            >
                                              {respuesta.sender === "Cliente"
                                                ? "Respuesta del cliente"
                                                : "Tu respuesta"}
                                            </TableCell>
                                            <TableCell>{respuesta.content}</TableCell>
                                          </TableRow>
                                          {respuesta.attachment && (
                                            <TableRow>
                                              <TableCell
                                                sx={{
                                                  fontWeight: "bold",
                                                  backgroundColor: "#f5f5f5",
                                                }}
                                              >
                                                Archivo adjunto
                                              </TableCell>
                                              <TableCell>
                                                {respuesta.attachment && renderAttachments(respuesta.attachment)}
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </Box>
                                ))
                              ) : (
                                <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                                  {filterDate
                                    ? "No hay respuestas en esta fecha"
                                    : "No hay respuestas registradas para esta consulta."}
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

    </Box>
  );
};

export default VistaAsesorFormulario;