import { useParams, useNavigate } from "react-router-dom"; // Importar useNavigate
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { TextField, Box, Button, Card, Typography, Grid, Avatar, IconButton } from '@mui/material';
import Swal from 'sweetalert2';
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
  ArrowBack as ArrowBackIcon, // Importar el ícono de regresar
  Download as DownloadIcon,
} from "@mui/icons-material";

const Respuesta = () => {
  const { consultaId } = useParams();
  const navigate = useNavigate(); // Obtener la función de navegación
  const [consultaData, setConsultaData] = useState(null);
  const [reply, setReply] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [respuestas, setRespuestas] = useState([]);

  // Función para obtener las respuestas
  const obtenerRespuestas = async () => {
    try {
      const respuestasRef = query(collection(db, "Responses"), where("consultaId", "==", consultaId));
      const respuestasSnapshot = await getDocs(respuestasRef);
      const respuestasData = respuestasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRespuestas(respuestasData);
    } catch (error) {
      console.error("Error al obtener las respuestas:", error);
    }
  };

  useEffect(() => {
    const fetchConsulta = async () => {
      try {
        const consultaRef = doc(db, "Consults", consultaId);
        const consultaDoc = await getDoc(consultaRef);

        if (consultaDoc.exists()) {
          setConsultaData(consultaDoc.data());
        } else {
          console.error("No se encontró la consulta con ID:", consultaId);
        }
      } catch (error) {
        console.error("Error al obtener la consulta:", error);
      }
    };

    if (consultaId) {
      fetchConsulta();
      obtenerRespuestas();
    }
  }, [consultaId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "bmp"].includes(fileExtension)) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSend = async () => {
    if (reply.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'No puedes enviar una respuesta vacía.',
      });
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No se encontró al usuario autenticado');
      }

      const respuestaRef = collection(db, "Responses");
      await addDoc(respuestaRef, {
        consultaId: consultaId,
        reply: reply,
        timestamp: new Date(),
        userId: user.uid,
      });

      const consultaRef = doc(db, "Consults", consultaId);
      await updateDoc(consultaRef, {
        status: "En proceso",
      });

      await obtenerRespuestas();

      Swal.fire({
        icon: 'success',
        title: 'Tu respuesta ha sido enviada exitosamente',
        text: '¿Quieres seguir respondiendo consultas?',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/asesor"); // Redirigir a /asesor
        } else {
          navigate("/"); // Redirigir a la página principal
        }
      });
    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al enviar tu respuesta. Por favor, inténtalo de nuevo.',
      });
    }
  };

  if (!consultaData) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: "#1B5C94" }}>
          Respuesta a la Consulta
        </Typography>

        {/* Información del cliente */}
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
        </Box>

        {/* Mensaje del cliente */}
        <Card sx={{ p: 2, mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Mensaje del Cliente
          </Typography>
          <Typography variant="body1">
            {consultaData.messageContent}
          </Typography>
        </Card>

        {/* Historial de respuestas */}
        <Card sx={{ p: 2, mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Historial de Respuestas
          </Typography>
          {respuestas.length > 0 ? (
            respuestas.map((respuesta, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <Typography variant="body1">
                  <strong>Respuesta:</strong> {respuesta.reply}
                </Typography>
                {respuesta.timestamp && (
                  <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                    Enviado el: {new Date(respuesta.timestamp.seconds * 1000).toLocaleString()}
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body1">No hay respuestas aún.</Typography>
          )}
        </Card>

        {/* Campo de respuesta */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Escribe tu respuesta aquí..."
            multiline
            rows={6}
            variant="outlined"
            fullWidth
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              },
            }}
          />
        </Box>

        {/* Archivo adjunto */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Archivo Adjunto
          </Typography>
          {file ? (
            <Box display="flex" alignItems="center" gap={1}>
              {/* Ícono y nombre del archivo */}
              {file.type.startsWith('image/') ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <img
                    src={filePreview}
                    alt={file.name}
                    style={{ maxWidth: "50px", maxHeight: "50px", borderRadius: "4px" }}
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

              {/* Enlace de descarga con ícono */}
              <IconButton
                component="a"
                href={URL.createObjectURL(file)}
                download={file.name}
                sx={{
                  color: "#1B5C94",
                  "&:hover": {
                    backgroundColor: "#e3f2fd",
                  },
                }}
              >
                <DownloadIcon />
              </IconButton>

              {/* Botón para eliminar el archivo */}
              <IconButton onClick={handleRemoveFile} sx={{ color: "error.main" }}>
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

        {/* Botones de acción */}
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/asesor")}
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
            Regresar
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
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
      </Card>
    </Box>
  );
};

// Función para obtener el ícono según el tipo de archivo
const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  switch (extension) {
    case "pdf":
      return <PdfIcon sx={{ color: "#FF0000", fontSize: 30 }} />;
    case "csv":
      return <FileIcon sx={{ color: "#4CAF50", fontSize: 30 }} />;
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

export default Respuesta;