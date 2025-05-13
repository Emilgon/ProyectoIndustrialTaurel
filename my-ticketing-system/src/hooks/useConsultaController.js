import { useState } from "react";
import { addConsulta } from "../models/consultaModel";

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
