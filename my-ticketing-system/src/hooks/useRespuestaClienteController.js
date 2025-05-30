import { useState, useEffect } from "react";
import {
  fetchRespuestasByConsultaId,
  fetchConsultaById,
  fetchDownloadUrls,
  addRespuesta,
} from "../models/respuestaClienteModel";
/*
import { fetchAdvisorById } from "../models/advisorsInfoModel";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
*/

const useRespuestaController = (consultaId) => {
  const [consultaData, setConsultaData] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});
  const [reply, setReply] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // const functions = getFunctions();
  // const auth = getAuth();
  // const sendResponseEmail = httpsCallable(functions, "sendResponseEmail");

  useEffect(() => {
    const fetchData = async () => {
      if (!consultaId) return;
      try {
        const consulta = await fetchConsultaById(consultaId);
        setConsultaData(consulta);

        if (consulta?.attachment) {
          const urls = await fetchDownloadUrls(consulta.attachment);
          setFileDownloadUrls(urls);
        }

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
    setFile(selectedFile);
    setFilePreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
  };

  const handleRemoveFile = () => {
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

      /*
      // 2. Obtener clientEmail
      let clientEmail = null;
      if (consultaData?.clientId) {
        try {
          const clientData = await fetchAdvisorById(consultaData.clientId);
          clientEmail = clientData.email || null;
        } catch (error) {
          console.error("Error fetching client email:", error);
        }
      }

      // 3. Enviar notificación por correo
      if (consultaData?.clientId && clientEmail) {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) {
          throw new Error("No se pudo obtener el email del asesor");
        }

        const emailData = {
          consultaId,
          reply,
          downloadUrl: downloadUrl || null,
          clientId: consultaData.clientId,
          clientEmail,
          advisorEmail: currentUser.email,
          affair: consultaData.affair || "Consulta sin asunto",
        };

        console.log("Enviando email con datos:", emailData);

        const result = await sendResponseEmail(emailData);
        console.log("Resultado del envío:", result.data);
      } else {
        throw new Error("No se pudo obtener el email del cliente");
      }
      */

      // 4. Limpiar formulario
      setReply("");
      setFile(null);
      setFilePreview(null);

      // 5. Actualizar lista de respuestas
      const updatedRespuestas = await fetchRespuestasByConsultaId(consultaId);
      setRespuestas(updatedRespuestas);

      return { success: true };
    } catch (error) {
      console.error("Error completo al enviar respuesta:", {
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack,
      });

      // Custom error message for missing client email
      let userFriendlyMessage = error.message;

      return {
        success: false,
        error: {
          message: userFriendlyMessage,
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
