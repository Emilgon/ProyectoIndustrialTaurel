import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth, storage } from "../firebaseConfig";
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
  TableChart as ExcelIcon,
} from "@mui/icons-material";

const Respuesta = () => {
  const { consultaId } = useParams();
  const navigate = useNavigate();
  const [consultaData, setConsultaData] = useState(null);
  const [reply, setReply] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});
  const [isSending, setIsSending] = useState(false);

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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las respuestas anteriores',
        footer: error.message
      });
    }
  };

  const fetchDownloadUrls = async (attachments) => {
    const urls = {};
    if (!attachments) return urls;

    const filePaths = attachments.split(", ").filter(path => path.trim() !== '');

    for (const filePath of filePaths) {
      try {
        const storageRef = ref(storage, filePath);
        const url = await getDownloadURL(storageRef);
        const fileName = filePath.split('/').pop();
        urls[fileName] = url;
      } catch (error) {
        console.error(`Error al obtener URL para ${filePath}:`, error);
        const fileName = filePath.split('/').pop();
        urls[fileName] = null;
      }
    }
    return urls;
  };

  useEffect(() => {
    const fetchConsulta = async () => {
      try {
        if (!consultaId) {
          Swal.fire('Error', 'No se proporcionó un ID de consulta válido', 'error');
          navigate('/consultas');
          return;
        }

        const consultaRef = doc(db, "Consults", consultaId);
        const consultaDoc = await getDoc(consultaRef);

        if (consultaDoc.exists()) {
          const data = consultaDoc.data();
          setConsultaData(data);

          if (data.attachment) {
            const urls = await fetchDownloadUrls(data.attachment);
            setFileDownloadUrls(urls);
          }
        } else {
          Swal.fire('Error', 'No se encontró la consulta solicitada', 'error');
          navigate('/consultas');
        }
      } catch (error) {
        console.error("Error al obtener la consulta:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la consulta',
          footer: error.message
        });
      }
    };

    fetchConsulta();
    obtenerRespuestas();
  }, [consultaId, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo demasiado grande',
        text: 'El tamaño máximo permitido es 10MB',
      });
      return;
    }

    setFile(selectedFile);

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp"].includes(fileExtension)) {
      setFilePreview(URL.createObjectURL(selectedFile));
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reply.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'Por favor escribe una respuesta antes de enviar',
      });
      return;
    }

    setIsSending(true);
    const loadingSwal = Swal.fire({
      title: 'Enviando respuesta...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let fileNameWithPath = null;
      let downloadUrl = null;
      
      if (file) {
        try {
          const uniqueFileName = `${Date.now()}_${file.name}`;
          const storagePath = `respuestas/${consultaId}/${uniqueFileName}`;
          const storageRef = ref(storage, storagePath);
          
          await uploadBytes(storageRef, file);
          downloadUrl = await getDownloadURL(storageRef);
          fileNameWithPath = storagePath;
        } catch (fileError) {
          console.error("Error al subir archivo:", fileError);
          throw new Error(`No se pudo subir el archivo adjunto: ${fileError.message}`);
        }
      }

      const responseData = {
        consultaId,
        content: reply,
        timestamp: new Date(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Asesor',
        attachment: fileNameWithPath
      };

      await addDoc(collection(db, "Responses"), responseData);

      

      setReply('');
      setFile(null);
      setFilePreview(null);
      await obtenerRespuestas();

      await loadingSwal.close();
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Respuesta enviada',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error("Error al procesar la respuesta:", error);
      await loadingSwal.close();
      Swal.fire({
        icon: error.message.includes('correo') ? 'warning' : 'error',
        title: error.message.includes('correo') ? 'Respuesta guardada' : 'Error',
        text: error.message.includes('correo')
          ? 'Se guardó la respuesta pero no se pudo enviar el correo'
          : 'Hubo un problema al procesar la respuesta',
        footer: error.message
      });
    } finally {
      setIsSending(false);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileIcon sx={{ color: "#9E9E9E", fontSize: 30 }} />;
    
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf": return <PdfIcon sx={{ color: "#FF0000", fontSize: 30 }} />;
      case "xls":
      case "xlsx": return <ExcelIcon sx={{ color: "#4CAF50", fontSize: 30 }} />;
      case "doc":
      case "docx": return <DocIcon sx={{ color: "#2196F3", fontSize: 30 }} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif": return <ImageIcon sx={{ color: "#FFC107", fontSize: 30 }} />;
      default: return <FileIcon sx={{ color: "#9E9E9E", fontSize: 30 }} />;
    }
  };

  if (!consultaData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">Cargando datos de la consulta...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, textAlign: 'left' }}>
      <Card sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>

        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: "#1B5C94" }}>
          Respuesta a la Consulta
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar sx={{ bgcolor: "#1B5C94", width: 32, height: 32 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Cliente: {consultaData.name || 'No especificado'}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar sx={{ bgcolor: "#1B5C94", width: 32, height: 32 }}>
              <BusinessIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Empresa: {consultaData.company || 'No especificada'}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: "#1B5C94", width: 32, height: 32 }}>
              <DescriptionIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Tipo de consulta: {consultaData.type || 'General'}
            </Typography>
          </Box>
        </Box>

        <Card sx={{ p: 2, mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Mensaje del Cliente
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {consultaData.messageContent}
          </Typography>

          {consultaData.attachment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Archivo Adjunto
              </Typography>
              {consultaData.attachment.split(", ").map((filePath, index) => {
                const fileName = filePath.split('/').pop();
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
                    {fileUrl ? (
                      <IconButton
                        component="a"
                        href={fileUrl}
                        download
                        rel="noopener noreferrer"
                        aria-label={`Descargar ${fileName}`}
                        sx={{ padding: 0 }}
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
                    ) : (
                      getFileIcon(fileName)
                    )}

                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {fileName}
                    </Typography>

                    {fileUrl && (
                      <IconButton
                        component="a"
                        href={fileUrl}
                        download
                        sx={{ color: "#1B5C94" }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Card>

        {respuestas.length > 0 && (
          <Card sx={{ p: 2, mb: 3, boxShadow: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Historial de Respuestas
            </Typography>
            {respuestas.map((respuesta, index) => (
              <Box
                key={index}
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  border: "1px solid #e0e0e0", 
                  borderRadius: 1,
                  backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  <strong>{respuesta.userName || 'Asesor'}:</strong> {respuesta.content}
                </Typography>
                {respuesta.timestamp && (
                  <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                    {new Date(respuesta.timestamp.seconds * 1000).toLocaleString()}
                  </Typography>
                )}

                {respuesta.attachment && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      Archivo adjunto:
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
                      {getFileIcon(respuesta.attachment.split('/').pop())}
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {respuesta.attachment.split('/').pop()}
                      </Typography>
                      <IconButton
                        component="a"
                        href={fileDownloadUrls[respuesta.attachment.split('/').pop()] || '#'}
                        download
                        sx={{ color: "#1B5C94" }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Card>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Escribe tu respuesta
          </Typography>
          
          <TextField
            label="Detalla tu respuesta aquí..."
            multiline
            rows={6}
            variant="outlined"
            fullWidth
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              },
            }}
          />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Adjuntar archivo (opcional)
            </Typography>
            {file ? (
              <Box display="flex" alignItems="center" gap={2}>
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt={file.name}
                    style={{
                      maxWidth: "60px",
                      maxHeight: "60px",
                      borderRadius: "4px",
                      border: "1px solid #e0e0e0"
                    }}
                  />
                ) : (
                  getFileIcon(file.name)
                )}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">{file.name}</Typography>
                  <Typography variant="caption">
                    {(file.size / 1024).toFixed(2)} KB
                  </Typography>
                </Box>
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
                  borderRadius: "8px",
                  borderColor: "#1B5C94",
                  color: "#1B5C94",
                  "&:hover": {
                    borderColor: "#145a8c",
                    backgroundColor: "rgba(27, 92, 148, 0.04)"
                  },
                }}
              >
                Seleccionar archivo
                <input 
                  type="file" 
                  hidden 
                  onChange={handleFileChange} 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
              </Button>
            )}
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              disabled={isSending}
              sx={{
                backgroundColor: "#f5f5f5",
                color: "#1B5C94",
                borderRadius: "8px",
                borderColor: "#1B5C94",
                "&:hover": {
                  backgroundColor: "#e3f2fd",
                },
                "&:disabled": {
                  opacity: 0.7
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              type="submit"
              disabled={isSending || !reply.trim()}
              sx={{
                backgroundColor: "#1B5C94",
                color: "white",
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "#145a8c",
                },
                "&:disabled": {
                  backgroundColor: "#9e9e9e"
                }
              }}
            >
              {isSending ? 'Enviando...' : 'Enviar Respuesta'}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Respuesta;