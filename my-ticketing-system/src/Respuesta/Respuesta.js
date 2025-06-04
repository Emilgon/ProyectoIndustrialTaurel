import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useRespuestaClienteController from "../hooks/useRespuestaClienteController";
import useRespuestaController from "../hooks/useRespuestaController";

import {
  Box,
  Button,
  Card,
  Typography,
  Avatar,
  IconButton,
  TextField,
} from "@mui/material";
import Swal from "sweetalert2";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  TableChart as ExcelIcon,
  CalendarToday as CalendarIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const Respuesta = () => {
  const { consultaId } = useParams();
  const navigate = useNavigate();

  const {
    consultaData,
    respuestas,
    fileDownloadUrls,
    reply,
    setReply,
    file,
    filePreview,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
  } = useRespuestaController(consultaId);

  const { respuestas: respuestasCliente } =
    useRespuestaClienteController(consultaId);

  const [allResponses, setAllResponses] = useState([]);
  const [filterDate, setFilterDate] = useState(null);

  useEffect(() => {
    const respuestas1 = [...respuestasCliente];
    const respuestas2 = [...respuestas];

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

    setAllResponses(mergedArray);
  }, [respuestasCliente, respuestas]);

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <PdfIcon sx={{ color: "#FF0000", fontSize: 30 }} />;
      case "xls":
      case "xlsx":
        return <ExcelIcon sx={{ color: "#4CAF50", fontSize: 30 }} />;
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

  const filteredResponses = filterDate
    ? allResponses.filter((response) => {
        const responseDate = new Date(response.timestamp.seconds * 1000);
        return (
          responseDate.getDate() === filterDate.getDate() &&
          responseDate.getMonth() === filterDate.getMonth() &&
          responseDate.getFullYear() === filterDate.getFullYear()
        );
      })
    : allResponses;

  const clearDateFilter = () => {
    setFilterDate(null);
  };

  if (!consultaData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Cargando datos de la consulta...
        </Typography>
      </Box>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await handleSubmit();
    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Respuesta enviada correctamente",
        text: "La respuesta se ha guardado y el cliente ha sido notificado",
        showConfirmButton: false,
        timer: 2000,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al guardar o enviar la respuesta",
        footer: result.error?.message || "",
      });
    }
  };

  return (
    <Box sx={{ p: 3, textAlign: "left" }}>
      <Card sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>

        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ color: "#1B5C94" }}
        >
          Respuesta a la Consulta
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar sx={{ bgcolor: "#1B5C94", width: 32, height: 32 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Cliente: {consultaData.name}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar sx={{ bgcolor: "#1B5C94", width: 32, height: 32 }}>
              <BusinessIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Empresa: {consultaData.company}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: "#1B5C94", width: 32, height: 32 }}>
              <DescriptionIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Tipo de consulta: {consultaData.type}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Avatar sx={{ bgcolor: "#1B5C94", width: 32, height: 32 }}>
              <DescriptionIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Fecha de envío:{" "}
              {consultaData.start_date && consultaData.start_date.seconds
                ? new Date(
                    consultaData.start_date.seconds * 1000
                  ).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date(consultaData.start_date).toLocaleDateString(
                    "es-ES",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
            </Typography>
          </Box>
        </Box>

        <Card sx={{ p: 2, mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Mensaje del Cliente
          </Typography>
          <Typography variant="body1">{consultaData.messageContent}</Typography>

          {consultaData.attachment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Archivo Adjunto
              </Typography>
              {consultaData.attachment.split(", ").map((fileName, index) => {
                const fileUrl = fileDownloadUrls[fileName];
                const isImage = ["jpg", "jpeg", "png", "gif"].includes(
                  fileName.split(".").pop().toLowerCase()
                );

                return (
                  <Box
                    key={index}
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
              })}
            </Box>
          )}
        </Card>

        {/* Sección de historial de respuestas movida aquí */}
        <Card sx={{ p: 2, mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h6" fontWeight="bold">
              Historial de Respuestas
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Filtrar por fecha"
                  value={filterDate}
                  onChange={(newValue) => setFilterDate(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={{ width: 180 }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <CalendarIcon sx={{ mr: 1 }} />,
                      }}
                    />
                  )}
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
            filteredResponses.map((respuesta, index) => (
              <Box
                key={index}
                backgroundColor={
                  respuesta.sender === "Cliente" ? "#DDDDDD33" : "#C4E4FF88"
                }
                sx={{
                  mb: 2,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1">
                  <strong>{respuesta.sender}:</strong> {respuesta.content}
                </Typography>
                {respuesta.timestamp && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, color: "text.secondary" }}
                  >
                    Enviado el:{" "}
                    {new Date(
                      respuesta.timestamp.seconds * 1000
                    ).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                )}

                {respuesta.attachment && (
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
                      {getFileIcon(respuesta.attachment)}
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {respuesta.attachment}
                      </Typography>
                      <IconButton
                        component="a"
                        href={`respuestas/${consultaId}/${respuesta.attachment}`}
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
            <Typography variant="body1">
              {filterDate ? "No hay respuestas en esta fecha" : "No hay respuestas aún."}
            </Typography>
          )}
        </Card>

        {/* Sección de respuesta */}
        <Box component="form" onSubmit={onSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Escribe tu respuesta aquí..."
              multiline
              rows={6}
              variant="outlined"
              fullWidth
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Archivo Adjunto
            </Typography>
            {file ? (
              <Box display="flex" alignItems="center" gap={1}>
                {filePreview ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <img
                      src={filePreview}
                      alt={file.name}
                      style={{
                        maxWidth: "50px",
                        maxHeight: "50px",
                        borderRadius: "4px",
                      }}
                    />
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      {file.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" gap={1}>
                    {getFileIcon(file.name)}
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      {file.name}
                    </Typography>
                  </Box>
                )}

                <IconButton
                  onClick={handleRemoveFile}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
                sx={{
                  borderRadius: "12px",
                  borderColor: "#1B5C94",
                  color: "#1B5C94",
                  "&:hover": {
                    borderColor: "#145a8c",
                  },
                }}
              >
                Adjuntar Archivo
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
            )}
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                backgroundColor: "#f5f5f5",
                color: "#1B5C94",
                borderRadius: "12px",
                borderColor: "#1B5C94",
                "&:hover": {
                  backgroundColor: "#e3f2fd",
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              type="submit"
              sx={{
                backgroundColor: "#1B5C94",
                color: "white",
                borderRadius: "12px",
                "&:hover": {
                  backgroundColor: "#145a8c",
                },
              }}
            >
              Enviar Respuesta
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Respuesta;