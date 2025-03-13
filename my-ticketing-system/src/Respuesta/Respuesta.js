import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth, storage } from "../firebaseConfig"; // Asegúrate de importar storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TextField, Box, Button, Card, Typography, Avatar, IconButton } from '@mui/material';
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
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  TableChart as ExcelIcon, // Ícono para archivos de Excel
} from "@mui/icons-material";

const Respuesta = () => {
  const { consultaId } = useParams();
  const navigate = useNavigate();
  const [consultaData, setConsultaData] = useState(null);
  const [reply, setReply] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({}); // Estado para almacenar las URLs de descarga

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

  // Función para obtener las URLs de descarga
  const fetchDownloadUrls = async (attachments) => {
    const urls = {};
    for (const fileName of attachments.split(", ")) {
      try {
        const storageRef = ref(storage, `ruta_de_tus_archivos/${fileName}`); // Asegúrate de que esta ruta sea correcta
        const url = await getDownloadURL(storageRef);
        urls[fileName] = url;
      } catch (error) {
        console.error("Error al obtener la URL de descarga:", error);
      }
    }
    return urls;
  };

  useEffect(() => {
    const fetchConsulta = async () => {
      try {
        const consultaRef = doc(db, "Consults", consultaId);
        const consultaDoc = await getDoc(consultaRef);

        if (consultaDoc.exists()) {
          setConsultaData(consultaDoc.data());

          // Obtener las URLs de descarga para los archivos adjuntos
          if (consultaDoc.data().attachment) {
            const urls = await fetchDownloadUrls(consultaDoc.data().attachment);
            console.log("URLs de descarga:", urls); // Verifica las URLs obtenidas
            setFileDownloadUrls(urls);
          }
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
        setFilePreview(URL.createObjectURL(selectedFile)); // Vista previa para imágenes
      } else {
        setFilePreview(null); // No hay vista previa para otros tipos de archivos
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

      let attachmentReplyUrl = null;

      // Si hay un archivo adjunto, súbelo a Firebase Storage
      if (file) {
        const fileRef = ref(storage, `responses/${consultaId}/${file.name}`); // Ruta en Storage
        await uploadBytes(fileRef, file); // Sube el archivo
        attachmentReplyUrl = await getDownloadURL(fileRef); // Obtiene la URL de descarga
      }

      const respuestaRef = collection(db, "Responses");
      await addDoc(respuestaRef, {
        consultaId: consultaId,
        reply: reply,
        timestamp: new Date(),
        userId: user.uid,
        attachmentReply: attachmentReplyUrl, // Guarda la URL del archivo adjunto
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
          navigate("/asesor");
        } else {
          navigate("/");
        }
      });

      // Limpiar el estado del archivo adjunto
      setFile(null);
      setFilePreview(null);
      setReply('');
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

          {/* Archivo adjunto del cliente */}
          {consultaData.attachment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Archivo Adjunto
              </Typography>
              {consultaData.attachment.split(", ").map((fileName, index) => {
                const fileUrl = fileDownloadUrls[fileName]; // URL de descarga del archivo
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
                    {/* Previsualización de la imagen o ícono del archivo */}
                    {fileUrl && (
                      <IconButton
                        component="a"
                        href={fileUrl}
                        download
                        rel="noopener noreferrer"
                        aria-label={`Descargar archivo ${fileName}`} // Mejora la accesibilidad
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

                    {/* Nombre del archivo */}
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {fileName}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Card>

        {/* Historial de respuestas */}
        <Card sx={{ p: 2, mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Historial de Respuestas
          </Typography>
          {respuestas.length > 0 ? (
            respuestas.map((respuesta, index) => (
              <Box
                key={index}
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

                {/* Mostrar el archivo adjunto de la respuesta */}
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
                      {/* Previsualización de la imagen */}
                      {respuesta.attachmentReply.startsWith("http") && (
                        <img
                          src={respuesta.attachmentReply}
                          alt="Previsualización"
                          style={{
                            maxWidth: "50px",
                            maxHeight: "50px",
                            borderRadius: "4px",
                          }}
                        />
                      )}

                      {/* Ícono y nombre del archivo */}
                      {getFileIcon(respuesta.attachmentReply.split("/").pop())}
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {respuesta.attachmentReply.split("/").pop()}
                      </Typography>

                      {/* Botón de descarga */}
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
              <Button
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
              </Button>

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
    case "xls":
    case "xlsx":
      return <ExcelIcon sx={{ color: "#4CAF50", fontSize: 30 }} />; // Ícono para archivos de Excel
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