import { useState, useEffect } from "react";
import {
  fetchRespuestasByConsultaId,
  fetchConsultaById,
  fetchDownloadUrls,
  addRespuesta,
} from "../models/respuestaClienteModel";

const useRespuestaController = (consultaId) => {
  const [consultaData, setConsultaData] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});
  const [reply, setReply] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Función para obtener URLs de descarga para múltiples archivos
  const fetchAllDownloadUrls = async (attachments) => {
    if (!attachments) return {};
    
    const urls = {};
    const files = attachments.split(", ");
    
    for (const fileName of files) {
      try {
        const fileInfo = await fetchDownloadUrls(fileName);
        urls[fileName] = fileInfo;
      } catch (error) {
        console.error(`Error al obtener URL para ${fileName}:`, error);
        urls[fileName] = { url: null, displayName: fileName };
      }
    }
    
    return urls;
  };

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      if (!consultaId) return;
      try {
        // 1. Obtener datos de la consulta
        const consulta = await fetchConsultaById(consultaId);
        setConsultaData(consulta);

        // 2. Obtener URLs para archivos adjuntos de la consulta
        if (consulta?.attachment) {
          const urls = await fetchAllDownloadUrls(consulta.attachment);
          setFileDownloadUrls(urls);
        }

        // 3. Obtener respuestas y sus archivos adjuntos
        const respuestasData = await fetchRespuestasByConsultaId(consultaId);
        setRespuestas(respuestasData);

        // 4. Obtener URLs para archivos adjuntos de las respuestas
        const responseUrls = {};
        for (const respuesta of respuestasData) {
          if (respuesta.attachment) {
            const urls = await fetchAllDownloadUrls(respuesta.attachment);
            Object.assign(responseUrls, urls);
          }
        }
        setFileDownloadUrls(prev => ({ ...prev, ...responseUrls }));
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
      // 1. Guardar la respuesta en Firestore
      await addRespuesta(consultaId, reply, file);

      // 2. Limpiar formulario
      setReply("");
      handleRemoveFile();

      // 3. Actualizar lista de respuestas y URLs de descarga
      const updatedRespuestas = await fetchRespuestasByConsultaId(consultaId);
      setRespuestas(updatedRespuestas);

      // 4. Actualizar URLs para nuevas respuestas con archivos adjuntos
      const newResponseUrls = {};
      for (const respuesta of updatedRespuestas) {
        if (respuesta.attachment && !fileDownloadUrls[respuesta.attachment]) {
          const urls = await fetchAllDownloadUrls(respuesta.attachment);
          Object.assign(newResponseUrls, urls);
        }
      }
      
      if (Object.keys(newResponseUrls).length > 0) {
        setFileDownloadUrls(prev => ({ ...prev, ...newResponseUrls }));
      }

      return { success: true };
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      return {
        success: false,
        error: {
          message: error.message || "Error al enviar la respuesta",
          details: error.details,
        },
      };
    }
  };

  return {
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
  };
};

export default useRespuestaController;