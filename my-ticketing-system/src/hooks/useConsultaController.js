import { useState } from "react";
import { addConsulta } from "../models/consultaModel";

/**
 * Hook personalizado para manejar la lógica del formulario de consulta.
 * Gestiona el estado del mensaje, archivo adjunto y asunto de la consulta.
 * @returns {object} Un objeto con los estados y funciones para el formulario de consulta.
 */
const useConsultaController = () => {
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [affair, setAffair] = useState("");

  const handleArchivoChange = (e) => {
    const archivoSeleccionado = e.target.files[0];
    setArchivo(archivoSeleccionado);
    const archivoUrl = URL.createObjectURL(archivoSeleccionado);
    setPreview(archivoUrl);
  };

  const handleEnviarConsulta = async (mensajeParam, archivoParam, affairParam) => {
    try {
      await addConsulta(mensajeParam, archivoParam, affairParam);
      setMensaje("");
      setArchivo(null);
      setPreview(null);
      setAffair("");
      return { success: true };
    } catch (error) {
      console.error("Error al enviar consulta:", error);
      return { success: false, error };
    }
  };

  return {
    mensaje,
    setMensaje,
    archivo,
    preview,
    affair,
    setAffair,
    handleArchivoChange,
    handleEnviarConsulta
  };
};

export default useConsultaController;
