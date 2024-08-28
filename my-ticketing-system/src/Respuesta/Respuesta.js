import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Importa updateDoc para actualizar documentos
import { db } from "../firebaseConfig";
import "./Respuesta.css";
import { TextField, Box, Button } from '@mui/material';
import Swal from 'sweetalert2';

const Respuesta = () => {
  const { consultaId } = useParams();
  const [consultaData, setConsultaData] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [ setFile] = useState(null);

  useEffect(() => {
    const fetchConsulta = async () => {
      try {
        const consultaRef = doc(db, "Consultas", consultaId);
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
    }
  }, [consultaId]);

  if (!consultaData) {
    return <div>Loading...</div>;
  }

  const renderPreview = (fileName) => {
    const fileExtension = fileName.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "bmp"].includes(fileExtension);

    if (isImage) {
      return (
        <div className="image-preview">
          <img src={`/uploads/${fileName}`} alt={`Preview of ${fileName}`} />
        </div>
      );
    } else {
      return (
        <a href={`/uploads/${fileName}`} target="_blank" rel="noopener noreferrer">
          {fileName}
        </a>
      );
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSend = async () => {
    if (respuesta.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'No puedes enviar una respuesta vacía.',
      });
      return;
    }

    try {
      // Actualiza la consulta en Firestore
      const consultaRef = doc(db, "Consultas", consultaId);
      await updateDoc(consultaRef, {
        respuesta: respuesta,
        estado: "En proceso", // Actualiza el estado a "En proceso"
      });

      Swal.fire({
        icon: 'success',
        title: 'Respuesta Enviada',
        text: 'Tu respuesta ha sido enviada exitosamente.',
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

  return (
    <div className="respuesta-container">
      <div className="respuesta-content">
        <h1>
          Cliente: {consultaData.nombre} {consultaData.apellido} de {consultaData.empresa}
        </h1>
        <p>Consulta de tipo {consultaData.tipo}</p>
        <p>Mensaje:</p>
        <div className="message-container">
          <p>{consultaData.mensaje}</p>
          {consultaData.adjuntado && consultaData.adjuntado.length > 0 && (
            <div className="adjuntos-container">
              <p>Archivos Adjuntos:</p>
              <ul>
                {consultaData.adjuntado.split(", ").map((fileName, index) => (
                  <li key={index}>{renderPreview(fileName)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Box mt={2}>
          <TextField
            label="Escribe tu respuesta aquí..."
            multiline
            rows={6}
            variant="outlined"
            fullWidth
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "22px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              },
            }}
          />
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
