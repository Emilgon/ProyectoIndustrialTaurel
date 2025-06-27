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
          // Extraer SOLO el nombre del archivo
          const fileName = decodeURIComponent(fileReference.split('/').pop().split('?')[0]);

          // fileReference es el nombre normalizado del archivo (ej: "documento_norm.pdf")
          // La ruta en Storage es "archivos/documento_norm.pdf"
          const storagePath = `archivos/${fileReference}`;
          let downloadUrl = null;

          try {
            const storageRef = ref(storage, storagePath);
            downloadUrl = await getDownloadURL(storageRef);
          } catch (error) {
            // Intentar con fileReference directamente como respaldo por si ya tiene 'archivos/' (caso improbable)
            try {
              console.warn(`Primer intento falló para ${storagePath}, intentando con ${fileReference} directamente.`);
              const storageRefBackup = ref(storage, fileReference);
              downloadUrl = await getDownloadURL(storageRefBackup);
            } catch (backupError) {
              console.error(`Error al obtener URL de descarga para ${fileReference} (intentos: ${storagePath}, ${fileReference}):`, backupError);
              throw new Error(`Archivo no encontrado: ${fileName} tras varios intentos.`);
            }
          }

          // Si llegamos aquí, downloadUrl debería estar seteado.
          // La clave es fileReference (nombre normalizado), displayName es el nombre limpio.
          urlMap[fileReference] = {
            url: downloadUrl,
            displayName: fileName // Mantenemos el nombre decodificado y limpio para mostrar
          };
        } catch (error) {
          // Este catch ahora es para el error lanzado por "Archivo no encontrado" o errores inesperados.
          console.error(`Error final procesando ${fileReference}:`, error);
          urlMap[fileReference] = {
            url: null,
            displayName: decodeURIComponent(fileReference.split('/').pop().split('?')[0]), // Nombre limpio para mostrar
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