import { useState, useEffect } from "react";
import {
  fetchRespuestasByConsultaId,
  fetchConsultaById,
  fetchDownloadUrls,
  addRespuesta
} from "../models/respuestaModel";

const useRespuestaController = (consultaId) => {
  const [consultaData, setConsultaData] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});
  const [reply, setReply] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!consultaId) return;
      const consulta = await fetchConsultaById(consultaId);
      setConsultaData(consulta);

      if (consulta && consulta.attachment) {
        const urls = await fetchDownloadUrls(consulta.attachment);
        setFileDownloadUrls(urls);
      }

      const respuestasData = await fetchRespuestasByConsultaId(consultaId);
      setRespuestas(respuestasData);
    };
    fetchData();
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

  const handleSubmit = async () => {
    if (!reply.trim()) return;

    try {
      await addRespuesta(consultaId, reply, file);
      setReply('');
      setFile(null);
      setFilePreview(null);

      // Refresh respuestas
      const respuestasData = await fetchRespuestasByConsultaId(consultaId);
      setRespuestas(respuestasData);

      return { success: true };
    } catch (error) {
      console.error("Error submitting respuesta:", error);
      return { success: false, error };
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
    handleSubmit
  };
};

export default useRespuestaController;
