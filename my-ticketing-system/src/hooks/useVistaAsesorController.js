import { useState, useEffect } from "react";
import {
  fetchConsultas,
  updateConsultaStatus,
  fetchRespuestasByConsultaId,
  fetchDownloadUrls,
  updateConsulta
} from "../models/vistaAsesorModel";

const useVistaAsesorController = () => {
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [historialAbierto, setHistorialAbierto] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});

  useEffect(() => {
    const loadConsultas = async () => {
      const data = await fetchConsultas();
      setConsultas(data);
    };
    loadConsultas();
  }, []);

  const handleResponderConsulta = async (id) => {
    await updateConsultaStatus(id, "En proceso");
    setConsultas(consultas.map(c => c.id === id ? { ...c, status: "En proceso" } : c));
  };

  const obtenerRespuestas = async (consultaId) => {
    const respuestasData = await fetchRespuestasByConsultaId(consultaId);
    setRespuestas(respuestasData);
  };

  const fetchDownloadUrlsForAttachments = async (attachments) => {
    const urls = await fetchDownloadUrls(attachments);
    setFileDownloadUrls(prev => ({ ...prev, ...urls }));
  };

  const handleToggleDetails = async (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
      const consulta = consultas.find(c => c.id === id);
      if (consulta && consulta.attachment) {
        await fetchDownloadUrlsForAttachments(consulta.attachment);
      }
    }
  };

  const handleToggleHistorial = async (id) => {
    if (historialAbierto === id) {
      setHistorialAbierto(null);
    } else {
      await obtenerRespuestas(id);
      setHistorialAbierto(id);
    }
  };

  const handleSave = async (selectedConsultId, editType, resolverDays, itemsCount, tipoAsesoria) => {
    let daysToResolve = resolverDays;

    if (editType === "Clasificación arancelaria" && itemsCount !== null) {
      daysToResolve = itemsCount < 10 ? 2 : 10;
    } else if (editType === "Asesoría técnica" && tipoAsesoria) {
      daysToResolve = tipoAsesoria === "Interna" ? 2 : 10;
    }

    const updateData = {
      type: editType,
      indicator: daysToResolve,
      start_date: new Date(),
      end_date: new Date(Date.now() + daysToResolve * 24 * 60 * 60 * 1000),
      remaining_days: daysToResolve,
      itemsCount: editType === "Clasificación arancelaria" ? itemsCount : null,
      tipoAsesoria: editType === "Asesoría técnica" ? tipoAsesoria : null
    };

    await updateConsulta(selectedConsultId, updateData);
    setConsultas(prev =>
      prev.map(c => c.id === selectedConsultId ? { ...c, ...updateData } : c)
    );
  };

  return {
    consultas,
    expandedRow,
    historialAbierto,
    respuestas,
    fileDownloadUrls,
    handleResponderConsulta,
    handleToggleDetails,
    handleToggleHistorial,
    handleSave
  };
};

export default useVistaAsesorController;
