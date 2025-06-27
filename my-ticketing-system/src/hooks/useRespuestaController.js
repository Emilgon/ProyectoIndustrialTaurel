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

      for (let originalFileReference of files) {
        let downloadUrl = null;
        let displayFileName = ''; // Nombre para mostrar y usar como clave
        let keyForUrlMap = originalFileReference; // Por defecto, la referencia original es la clave

        try {
          const decodedFileReference = decodeURIComponent(originalFileReference);

          // Intentar extraer un nombre de archivo limpio de la referencia (sea URL o no)
          // Esto servirá como displayName y como clave si la originalFileReference es una URL.
          displayFileName = decodedFileReference.substring(decodedFileReference.lastIndexOf('/') + 1).split('?')[0];
          if (!displayFileName) displayFileName = decodedFileReference; // Si no hay '/', es el nombre mismo


          if (decodedFileReference.startsWith("http://") || decodedFileReference.startsWith("https://")) {
            if (decodedFileReference.includes("firebasestorage.googleapis.com")) {
              downloadUrl = decodedFileReference; // Es una URL de Firebase, usarla directamente
              keyForUrlMap = displayFileName; // Usar el nombre extraído como clave para consistencia
              console.log(`Detectada URL de Firebase Storage: ${downloadUrl}, usando nombre de archivo '${keyForUrlMap}' como clave.`);
            } else {
              // Es otra URL, no la manejamos para descarga directa de Storage, podría ser un enlace externo
              console.warn(`Referencia es una URL externa no Firebase: ${decodedFileReference}`);
              displayFileName = decodedFileReference; // Mostrar la URL completa si es externa
              keyForUrlMap = displayFileName;
            }
          } else {
            // No es una URL, asumimos que es un nombre de archivo (normalizado o no)
            // Este es el caso esperado para nuevas subidas.
            keyForUrlMap = decodedFileReference; // El nombre de archivo es la clave
            displayFileName = decodedFileReference; // Y también el nombre a mostrar
            const storagePath = `archivos/${decodedFileReference}`;
            console.log(`Procesando como nombre de archivo: ${decodedFileReference}, intentando ruta: ${storagePath}`);
            try {
              const storageRef = ref(storage, storagePath);
              downloadUrl = await getDownloadURL(storageRef);
            } catch (storageError) {
              // Intento de respaldo por si 'decodedFileReference' ya tenía 'archivos/' (poco probable para datos nuevos)
              console.warn(`Intento con '${storagePath}' falló. Intentando directamente con '${decodedFileReference}'. Error: ${storageError.message}`);
              try {
                  const backupStorageRef = ref(storage, decodedFileReference);
                  downloadUrl = await getDownloadURL(backupStorageRef);
              } catch (backupStorageError) {
                console.error(`Todos los intentos de obtener URL de descarga para '${decodedFileReference}' fallaron.`, backupStorageError);
                throw new Error(`Archivo no encontrado: ${displayFileName} tras varios intentos.`);
              }
            }
          }

          urlMap[keyForUrlMap] = {
            url: downloadUrl,
            displayName: displayFileName
          };

        } catch (error) {
          console.error(`Error final procesando referencia '${originalFileReference}':`, error);
          // Asegurar que displayFileName tenga un valor incluso en error para la clave
          if (!displayFileName && originalFileReference) {
             displayFileName = decodeURIComponent(originalFileReference.substring(originalFileReference.lastIndexOf('/') + 1).split('?')[0] || originalFileReference);
          } else if (!displayFileName) {
            displayFileName = "archivo_desconocido";
          }
          keyForUrlMap = displayFileName; // Usar el nombre extraído o por defecto como clave en error

          urlMap[keyForUrlMap] = {
            url: null,
            displayName: displayFileName,
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

        // Procesar adjuntos de la consulta inicial
        if (consulta?.attachment) {
          console.log("Procesando adjuntos de la consulta inicial:", consulta.attachment);
          const consultaAttachmentUrls = await fetchAllDownloadUrls(consulta.attachment);
          setFileDownloadUrls(consultaAttachmentUrls);
        }

        const respuestasData = await fetchRespuestasByConsultaId(consultaId);
        setRespuestas(respuestasData);

        // Procesar adjuntos de las respuestas
        const responseUrls = {};
        for (const respuesta of respuestasData) {
          if (respuesta.attachment) {
            console.log(`Procesando adjuntos de respuesta ${respuesta.id}:`, respuesta.attachment);
            const urls = await fetchAllDownloadUrls(respuesta.attachment);
            Object.assign(responseUrls, urls);
          }
        }
        // Combinar URLs de adjuntos de consulta y respuestas
        // Dando prioridad a las URLs de respuesta si hay colisión de claves (poco probable si las claves son nombres de archivo únicos)
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