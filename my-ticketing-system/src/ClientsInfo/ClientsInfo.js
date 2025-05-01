import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Collapse,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import { db, storage } from "../firebaseConfig";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import LogoutIcon from "@mui/icons-material/Logout";
import AttachmentIcon from "@mui/icons-material/Attachment";
import GetAppIcon from "@mui/icons-material/GetApp";

const ClientsInfo = () => {
  const [empresas, setEmpresas] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showLastQuery, setShowLastQuery] = useState(false);
  const [showLastFiveQueries, setShowLastFiveQueries] = useState(false);
  const [fileUrls, setFileUrls] = useState({});
  const navigate = useNavigate();

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) {
      return "Fecha no disponible";
    }
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const fetchDownloadUrl = async (fileName) => {
    try {
      const storageRef = ref(storage, `attachments/${fileName}`);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Error al obtener la URL de descarga:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchEmpresas = async () => {
      const querySnapshot = await getDocs(collection(db, "Clients"));
      const empresasData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const empresa = { id: doc.id, ...doc.data() };

          const consultasRef = query(
            collection(db, "Consults"),
            where("name", "==", empresa.name)
          );
          const consultasSnapshot = await getDocs(consultasRef);
          const numConsultas = consultasSnapshot.size;

          return {
            ...empresa,
            numConsultas
          };
        })
      );
      setEmpresas(empresasData);
    };
    fetchEmpresas();
  }, []);

  const handleRowClick = async (empresaId, empresaName) => {
    if (expandedRow === empresaId) {
      setExpandedRow(null);
      setConsultas([]);
      setShowLastQuery(false);
      setShowLastFiveQueries(false);
      return;
    }
    
    setExpandedRow(empresaId);
    await fetchLastQuery(empresaName);
  };

  const fetchLastQuery = async (empresaName) => {
    const consultaRef = query(
      collection(db, "Consults"),
      where("name", "==", empresaName),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const consultaSnapshot = await getDocs(consultaRef);
    const consultaData = consultaSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    const urls = {};
    for (const consulta of consultaData) {
      if (consulta.attachment) {
        const fileNames = consulta.attachment.split(", ");
        for (const fileName of fileNames) {
          if (!fileUrls[fileName]) {
            const url = await fetchDownloadUrl(fileName);
            if (url) urls[fileName] = url;
          }
        }
      }
    }
    setFileUrls(prev => ({ ...prev, ...urls }));
    
    setConsultas(consultaData);
    setShowLastQuery(true);
    setShowLastFiveQueries(false);
  };

  const fetchLastFiveQueries = async (empresaName) => {
    const consultasRef = query(
      collection(db, "Consults"),
      where("name", "==", empresaName),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const consultasSnapshot = await getDocs(consultasRef);
    const consultasData = consultasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    const urls = {};
    for (const consulta of consultasData) {
      if (consulta.attachment) {
        const fileNames = consulta.attachment.split(", ");
        for (const fileName of fileNames) {
          if (!fileUrls[fileName]) {
            const url = await fetchDownloadUrl(fileName);
            if (url) urls[fileName] = url;
          }
        }
      }
    }
    setFileUrls(prev => ({ ...prev, ...urls }));
    
    setConsultas(consultasData);
    setShowLastQuery(false);
    setShowLastFiveQueries(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="#1B5C94" gutterBottom>
          Información de Clientes
        </Typography>
        <Tooltip title="Salir al panel de control" arrow>
          <IconButton
            onClick={() => navigate("/asesor-control")}
            sx={{
              color: "#1B5C94",
              "&:hover": {
                backgroundColor: "rgba(27, 92, 148, 0.1)"
              }
            }}
          >
            <LogoutIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#1B5C94" }}>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cliente</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Consultas activas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empresas.map((empresa) => (
              <React.Fragment key={empresa.id}>
                <TableRow 
                  hover 
                  onClick={() => handleRowClick(empresa.id, empresa.name)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{empresa.company}</TableCell>
                  <TableCell>{empresa.email}</TableCell>
                  <TableCell>{empresa.numConsultas}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                    <Collapse in={expandedRow === empresa.id} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 2, 
                          mb: 2,
                          '& .MuiButton-root': {
                            minWidth: 180,
                            height: 40,
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            boxShadow: 'none',
                            '&:hover': {
                              boxShadow: '0px 2px 4px rgba(0,0,0,0.2)'
                            }
                          }
                        }}>
                          <Button
                            variant={showLastQuery ? "contained" : "outlined"}
                            sx={{
                              backgroundColor: showLastQuery ? '#1B5C94' : 'transparent',
                              color: showLastQuery ? 'white' : '#1B5C94',
                              border: '2px solid #1B5C94',
                              '&:hover': {
                                backgroundColor: showLastQuery ? '#14507D' : 'rgba(27, 92, 148, 0.08)',
                                border: '2px solid #1B5C94'
                              }
                            }}
                            onClick={() => fetchLastQuery(empresa.name)}
                          >
                            Última consulta
                          </Button>
                          <Button
                            variant={showLastFiveQueries ? "contained" : "outlined"}
                            sx={{
                              backgroundColor: showLastFiveQueries ? '#1B5C94' : 'transparent',
                              color: showLastFiveQueries ? 'white' : '#1B5C94',
                              border: '2px solid #1B5C94',
                              '&:hover': {
                                backgroundColor: showLastFiveQueries ? '#14507D' : 'rgba(27, 92, 148, 0.08)',
                                border: '2px solid #1B5C94'
                              }
                            }}
                            onClick={() => fetchLastFiveQueries(empresa.name)}
                          >
                            Últimas 5 consultas
                          </Button>
                        </Box>

                        {(showLastQuery || showLastFiveQueries) && consultas.length > 0 && (
                          <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Contenido</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Adjuntos</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {consultas.map((consulta, index) => (
                                  <TableRow key={consulta.id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{formatDate(consulta.timestamp)}</TableCell>
                                    <TableCell>{consulta.name}</TableCell>
                                    <TableCell sx={{ maxWidth: 300 }}>
                                      <Box sx={{ 
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {consulta.messageContent}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      {consulta.attachment ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                          {consulta.attachment.split(", ").map((fileName) => (
                                            <Chip
                                              key={fileName}
                                              icon={<AttachmentIcon />}
                                              label={fileName}
                                              onClick={() => window.open(fileUrls[fileName], '_blank')}
                                              deleteIcon={<GetAppIcon />}
                                              onDelete={fileUrls[fileName] ? () => window.open(fileUrls[fileName], '_blank') : undefined}
                                              variant="outlined"
                                              sx={{ 
                                                maxWidth: 200,
                                                '& .MuiChip-label': {
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis'
                                                }
                                              }}
                                            />
                                          ))}
                                        </Box>
                                      ) : (
                                        <Typography variant="body2" color="textSecondary">
                                          Sin adjuntos
                                        </Typography>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClientsInfo;