import { useState } from "react";
import { addConsulta } from "../models/consultaModel";

const useConsultaController = () => {
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleArchivoChange = (e) => {
    const archivoSeleccionado = e.target.files[0];
    setArchivo(archivoSeleccionado);
    const archivoUrl = URL.createObjectURL(archivoSeleccionado);
    setPreview(archivoUrl);
  };

  const handleEnviarConsulta = async () => {
    try {
      await addConsulta(mensaje, archivo);
      setMensaje("");
      setArchivo(null);
      setPreview(null);
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
    handleArchivoChange,
    handleEnviarConsulta
  };
};

export default useConsultaController;
