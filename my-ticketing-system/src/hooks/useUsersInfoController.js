 import { useState, useEffect } from "react";
import {
  fetchUsers,
  fetchDownloadUrls
} from "../models/usersInfoModel";

import { fetchConsultasByClientName } from "../models/clientsInfoModel";

/**
 * Hook personalizado para manejar la lógica de la vista de información de clientes.
 * Obtiene y gestiona los datos de los clientes y sus consultas.
 * @returns {object} Un objeto con los estados y funciones para la vista de información de clientes.
 */
const useUsersInfoController = () => {
  const [users, setUsers] = useState([]);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});
  const [searchClient, setSearchClient] = useState("");
  const [showLastQuery, setShowLastQuery] = useState(false);
  const [showLastFiveQueries, setShowLastFiveQueries] = useState(false);
  const [showAllQueries, setShowAllQueries] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      const data = await fetchUsers();
      // Procesamos los users para contar consultas activas y adjuntar consultas
      const processedUsers = await Promise.all(data.map(async (user) => {
        const consultasData = await fetchConsultasByClientName(user.name, 5); // Obtenemos las últimas 5 consultas

        // CORRECCIÓN: Asegurarnos de contar correctamente las consultas "En proceso"
        const activeConsultas = consultasData.filter(consulta =>
          consulta.status && consulta.status.toLowerCase() === "en proceso"
        ).length;

        return {
          ...user,
          numConsultas: activeConsultas,
          consultas: consultasData
        };
      }));
      setUsers(processedUsers);
    };
    loadUsers();
  }, []);

  const handleRowClick = async (clientId, clientName) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      setConsultas([]);
      setShowLastQuery(false);
      setShowLastFiveQueries(false);
      setShowAllQueries(false);
      return;
    }
    setExpandedClientId(clientId);
    await fetchLastQuery(clientName);
  };

  const fetchLastQuery = async (clientName) => {
    const consultasData = await fetchConsultasByClientName(clientName, 1);
    await fetchAndSetDownloadUrls(consultasData);
    setConsultas(consultasData);
    setShowLastQuery(true);
    setShowLastFiveQueries(false);
    setShowAllQueries(false);
  };

  const fetchLastFiveQueries = async (clientName) => {
    const consultasData = await fetchConsultasByClientName(clientName, 5);
    await fetchAndSetDownloadUrls(consultasData);
    setConsultas(consultasData);
    setShowLastQuery(false);
    setShowLastFiveQueries(true);
    setShowAllQueries(false);
  };

  const fetchAllQueries = async (clientName) => {
    // Usamos un número grande como límite para obtener todas las consultas
    const consultasData = await fetchConsultasByClientName(clientName, 1000);
    await fetchAndSetDownloadUrls(consultasData);
    setConsultas(consultasData);
    setShowLastQuery(false);
    setShowLastFiveQueries(false);
    setShowAllQueries(true);
  };

  const fetchAndSetDownloadUrls = async (consultasData) => {
    const urls = {};
    for (const consulta of consultasData) {
      if (consulta.attachment) {
        const fileNames = consulta.attachment.split(", ");
        for (const fileName of fileNames) {
          if (!fileDownloadUrls[fileName]) {
            const url = await fetchDownloadUrls(consulta.attachment);
            Object.assign(urls, url);
          }
        }
      }
    }
    setFileDownloadUrls(prev => ({ ...prev, ...urls }));
  };

  const filteredUsers = users.filter(user =>
    user.companyName.toLowerCase().includes(searchClient.toLowerCase())
  );

  return {
    users: filteredUsers,
    expandedClientId,
    consultas,
    fileDownloadUrls,
    searchClient,
    setSearchClient,
    showLastQuery,
    showLastFiveQueries,
    showAllQueries,
    handleRowClick,
    fetchLastQuery,
    fetchLastFiveQueries,
    fetchAllQueries,
    setShowLastQuery,
    setShowLastFiveQueries,
    setShowAllQueries
  };
};

export default useUsersInfoController;