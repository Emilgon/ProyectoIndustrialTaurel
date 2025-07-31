import { useState, useEffect } from "react";
import {
  fetchRespuestasByConsultaId,
  fetchConsultaById,
  addRespuesta,
} from "../models/respuestaClienteModel";

/**
 * Hook personalizado para manejar la lógica de la vista de respuesta del cliente.
 * Obtiene datos de la consulta, respuestas y gestiona el envío de nuevas respuestas.
 * @param {string} consultaId - El ID de la consulta.
 * @returns {object} Un objeto con los estados y funciones para la vista de respuesta del cliente.
 */
const useRespuestaController = (consultaId) => {
  const [consultaData, setConsultaData] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [reply, setReply] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!consultaId) return;
      try {
        const consulta = await fetchConsultaById(consultaId);
        setConsultaData(consulta);

        const respuestasData = await fetchRespuestasByConsultaId(consultaId);
        setRespuestas(respuestasData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [consultaId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async () => {
    if (!reply.trim()) {
      return {
        success: false,
        error: { message: "El mensaje de respuesta no puede estar vacío" },
      };
    }

    try {
      await addRespuesta(consultaId, reply, file);
      setReply("");
      handleRemoveFile();

      const updatedRespuestas = await fetchRespuestasByConsultaId(consultaId);
      setRespuestas(updatedRespuestas);

      return { success: true };
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      return {
        success: false,
        error: {
          message: error.message || "Error al enviar la respuesta",
        },
      };
    }
  };

  return {
    consultaData,
    respuestas,
    reply,
    setReply,
    file,
    filePreview,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
  };
};

export default useRespuestaController;