import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import "./Respuesta.css";
import { TextField, Box, Button } from '@mui/material';
import Swal from 'sweetalert2';

const Respuesta = () => {
  const { consultaId } = useParams();
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
      const user = auth.currentUser; // Obtén el usuario autenticado
      if (!user) {
        throw new Error('No se encontró al usuario autenticado');
      }

      const respuestaRef = collection(db, "Responses");
      await addDoc(respuestaRef, {
        consultaId: consultaId,
        reply: reply,
        timestamp: new Date(),
        userId: user.uid,  // Aquí agregamos el userId
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
          window.location.href = '/asesor';
        } else {
          window.location.href = '/';
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
    <div className="reply-container">
      <div className="reply-content">
        {/* Contenedor Cliente */}
        <div className="client-container">
          <h1>
            Cliente: {consultaData.name} de {consultaData.company}
          </h1>
        </div>

        <p>Consulta de tipo {consultaData.type}</p>
        <p>Mensaje:</p>
        <div className="message-container">
          <p>{consultaData.messageContent}</p>
          <div className="respuestas-historial">
            {respuestas.length > 0 ? (
              respuestas.map((respuesta, index) => (
                <div key={index} className="respuesta-item">
                  <p><strong>Respuesta:</strong> {respuesta.reply}</p>
                  {respuesta.timestamp && (
                    <p><small>Enviado el: {new Date(respuesta.timestamp.seconds * 1000).toLocaleString()}</small></p>
                  )}
                </div>
              ))
            ) : (
              <p>No hay respuestas aún.</p>
            )}
          </div>


        </div>
        <Box mt={2}>
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
                borderRadius: "22px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              },
            }}
          />
        </Box>
        <Box mt={2}>
          <p>Archivo seleccionado:</p>
          {file ? (
            <div className="file-preview" style={{ display: 'flex', alignItems: 'center' }}>
              {file.type.startsWith('image/') ? (
                <img src={filePreview} alt={file.name} style={{ maxWidth: "200px", maxHeight: "150px", marginRight: '8px' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-file" style={{ marginRight: '8px' }}></i>
                  <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer">{file.name}</a>
                </div>
              )}
            </div>
          ) : (
            <span>No se ha seleccionado ningún archivo.</span>
          )}
        </Box>
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button
            variant="contained"
            component="label"
            sx={{
              backgroundColor: "#d9d9d9",
              color: "#000",
              borderRadius: "22px",
              "&:hover": {
                backgroundColor: "#bfbfbf",
              },
            }}
          >
            Adjuntar Archivo
            <input
              type="file"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSend}
            sx={{
              backgroundColor: "#1B5C94",
              color: "white",
              borderRadius: "22px",
              "&:hover": {
                backgroundColor: "#145a8c",
              },
            }}
          >
            Enviar
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default Respuesta;
