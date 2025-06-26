import { useState, useEffect } from "react";
import {
  fetchRespuestasByConsultaId,
  fetchConsultaById,
  fetchDownloadUrls,
  addRespuesta,
} from "../models/respuestaModel";
import { fetchClientById } from "../models/clientsInfoModel";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

/**
 * Hook personalizado para manejar la lógica de respuesta del asesor a una consulta.
 * Obtiene datos de la consulta, respuestas, gestiona el envío de nuevas respuestas y notificaciones por correo.
 * @param {string} consultaId - El ID de la consulta.
 * @returns {object} Un objeto con los estados y funciones para la vista de respuesta del asesor.
 */
const useRespuestaController = (consultaId) => {
  const [consultaData, setConsultaData] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});
  const [reply, setReply] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const functions = getFunctions();
  const auth = getAuth();
  const sendResponseEmail = httpsCallable(functions, "sendResponseEmail");

  useEffect(() => {
    const fetchAllDownloadUrls = async (attachments) => {
      if (!attachments) return {};

      const urlMap = {};
      const files = attachments.split(", ");

      for (let fileReference of files) {
        try {
          // Extraer SOLO el nombre del archivo (última parte después del último /)
          const fileName = decodeURIComponent(fileReference.split('/').pop().split('?')[0]);

          // Eliminar cualquier prefijo duplicado 'archivos/archivos/' en cualquier parte de la cadena
          const cleanReference = fileReference.replace(/archivos\/archivos\//g, 'archivos/');

          // Posibles patrones de ruta a probar en orden de prioridad
          const possiblePaths = [
            `archivos/${fileName}`,          // Ruta directa con nombre de archivo
            cleanReference,                  // Ruta original limpia
            fileReference,                   // Ruta original (por si acaso)
            fileName                         // Solo el nombre del archivo
          ];

          let downloadUrl = null;
          let successfulPath = null;

          // Probar cada posible ruta hasta encontrar una que funcione
          for (const path of possiblePaths) {
            try {
              console.log(`Intentando obtener URL para: ${path}`);
              const storageRef = ref(storage, path);
              downloadUrl = await getDownloadURL(storageRef);
              successfulPath = path;
              console.log(`Éxito al obtener URL para: ${path}`);
              break;
            } catch (error) {
              console.log(`Fallo al obtener URL para: ${path}`, error);
              continue;
            }
          }

          if (!downloadUrl) {
            throw new Error(`Archivo no encontrado en ninguna ubicación probada: ${fileName}`);
          }

          console.log(`Archivo encontrado en: ${successfulPath}`);
          // Use fileName as key instead of fileReference to avoid duplicated path issues
          urlMap[fileName] = {
            url: downloadUrl,
            displayName: fileName,
            path: successfulPath
          };
        } catch (error) {
          console.error(`Error procesando ${fileReference}:`, error);
          urlMap[fileReference] = {
            url: null,
            displayName: fileReference.split('/').pop(),
            error: error.message
          };
        }
      }

      return urlMap;
    };

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
      const { downloadUrl } = await addRespuesta(consultaId, reply, file);

      // 2. Obtener clientEmail
      let clientEmail = null;
      if (consultaData?.clientId) {
        try {
          const clientData = await fetchClientById(consultaData.clientId);
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
      if (
        error.message ===
        "El cliente no tiene un correo electrónico registrado" ||
        error.message === "No se pudo obtener el email del cliente"
      ) {
        userFriendlyMessage =
          "El cliente no tiene un correo electrónico registrado. Por favor, verifique los datos del cliente.";
      }

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