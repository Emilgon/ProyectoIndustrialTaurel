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

  const fetchAllDownloadUrls = async (attachments) => {
    if (!attachments) return {};

    const urlMap = {};
    const files = attachments.split(", ");

    for (let fileReference of files) {
      try {
        let storagePath = fileReference;

        // Si es una URL completa de Firebase Storage
        if (fileReference.includes('firebasestorage.googleapis.com')) {
          // Extraemos la parte importante de la URL
          const urlObj = new URL(fileReference);
          storagePath = decodeURIComponent(urlObj.pathname
            .replace('/v0/b/proyectoindustrialtaurel.firebasestorage.app/o/', '')
            .replace(/%2F/g, '/'));
        }

        else if (fileReference.startsWith('archivos/')) {
          // La mantenemos como está
          storagePath = fileReference;
        }

        // Si es solo un nombre de archivo
        else {
          // Asumimos que está en la carpeta "archivos/"
          storagePath = `archivos/${fileReference}`;
        }

        const urls = await fetchDownloadUrls(storagePath);
        // fetchDownloadUrls now returns an object with fileName keys and url values
        // We need to get the url for the fileReference or fileName
        const displayName = storagePath.split('/').pop();
        const url = urls[displayName] || null;
        urlMap[fileReference] = { url, displayName };

      } catch (error) {
        console.error(`Error al obtener URL para ${fileReference}:`, error);
        urlMap[fileReference] = { url: null, displayName: fileReference };
      }
    }

    return urlMap;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!consultaId) return;
      try {
        const consulta = await fetchConsultaById(consultaId);
        setConsultaData(consulta);

        if (consulta?.attachment) {
          const urls = await fetchAllDownloadUrls(consulta.attachment);
          setFileDownloadUrls(urls);
        }

        const respuestasData = await fetchRespuestasByConsultaId(consultaId);
        setRespuestas(respuestasData);

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
      await addRespuesta(consultaId, reply, file);
      setReply("");
      handleRemoveFile();

      const updatedRespuestas = await fetchRespuestasByConsultaId(consultaId);
      setRespuestas(updatedRespuestas);

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