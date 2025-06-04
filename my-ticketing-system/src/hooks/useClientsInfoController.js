import { useState, useEffect } from "react";
import {
  fetchClients,
  fetchConsultasByClientName,
  fetchDownloadUrls
} from "../models/clientsInfoModel";

const useClientsInfoController = () => {
  const [clients, setClients] = useState([]);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [fileDownloadUrls, setFileDownloadUrls] = useState({});
  const [searchClient, setSearchClient] = useState("");
  const [showLastQuery, setShowLastQuery] = useState(false);
  const [showLastFiveQueries, setShowLastFiveQueries] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      const data = await fetchClients();
      // Procesamos los clientes para contar consultas activas
      const processedClients = await Promise.all(data.map(async (client) => {
        const consultasData = await fetchConsultasByClientName(client.name, 5); // Obtenemos las últimas 5 consultas
        const activeConsultas = consultasData.filter(consulta => consulta.status === "En proceso").length;
        return {
          ...client,
          numConsultas: activeConsultas
        };
      }));
      setClients(processedClients);
    };
    loadClients();
  }, []);

  const handleRowClick = async (clientId, clientName) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      setConsultas([]);
      setShowLastQuery(false);
      setShowLastFiveQueries(false);
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
  };

  const fetchLastFiveQueries = async (clientName) => {
    const consultasData = await fetchConsultasByClientName(clientName, 5);
    await fetchAndSetDownloadUrls(consultasData);
    setConsultas(consultasData);
    setShowLastQuery(false);
    setShowLastFiveQueries(true);
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

  const filteredClients = clients.filter(client =>
    client.company.toLowerCase().includes(searchClient.toLowerCase())
  );

  return {
    clients: filteredClients,
    expandedClientId,
    consultas,
    fileDownloadUrls,
    searchClient,
    setSearchClient,
    showLastQuery,
    showLastFiveQueries,
    handleRowClick,
    fetchLastQuery,
    fetchLastFiveQueries
  };
};

export default useClientsInfoController;