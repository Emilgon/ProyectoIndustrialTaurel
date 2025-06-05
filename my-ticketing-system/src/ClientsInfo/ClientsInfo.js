import React, { useState } from "react";
import {
  Box, Button, TextField, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Collapse,
  Chip, IconButton, InputAdornment, Menu, MenuItem, Avatar, Divider, Tabs, Tab,
  Popover
} from "@mui/material";
import {
  Attachment, GetApp, Search, Clear,
  StarBorder, Star, Sort, DateRange
} from "@mui/icons-material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import useClientsInfoController from "../hooks/useClientsInfoController";

const ClientsInfo = () => {
  const {
    clients,
    expandedClientId,
    consultas,
    fileDownloadUrls,
    handleRowClick,
    fetchLastQuery,
    fetchLastFiveQueries,
    showLastQuery,
    showLastFiveQueries
  } = useClientsInfoController();

  const [activeTab, setActiveTab] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [quickSearch, setQuickSearch] = useState("");
  const [anchorElSort, setAnchorElSort] = useState(null);
  const [sortOption, setSortOption] = useState("recent");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState(null);

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) {
      return "Fecha no disponible";
    }
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const toggleFavorite = (clientId) => {
    setFavorites(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleDatePickerClick = (event) => {
    setDatePickerAnchorEl(event.currentTarget);
  };

  const handleDatePickerClose = () => {
    setDatePickerAnchorEl(null);
  };

  const handleDateRangeClear = () => {
    setStartDate(null);
    setEndDate(null);
    handleDatePickerClose();
  };

  const filteredClients = clients
    .filter(client => {
      if (!quickSearch.trim()) return true;
      
      const searchTerm = quickSearch.toLowerCase().trim();
      
      if (
        (client.company && client.company.toLowerCase().includes(searchTerm)) ||
        (client.email && client.email.toLowerCase().includes(searchTerm))
      ) {
        return true;
      }

      if (client.consultas && client.consultas.length > 0) {
        return client.consultas.some(consulta => 
          consulta.messageContent && 
          consulta.messageContent.toLowerCase().includes(searchTerm)
        );
      }

      return false;
    })
    .filter(client => {
      // Si no hay fechas seleccionadas, mostrar todos
      if (!startDate && !endDate) return true;

      // Verificar si alguna consulta del cliente está dentro del rango de fechas
      if (client.consultas && client.consultas.length > 0) {
        return client.consultas.some(consulta => {
          if (!consulta.timestamp?.seconds) return false;
          
          const consultaDate = new Date(consulta.timestamp.seconds * 1000);
          
          if (startDate && endDate) {
            return consultaDate >= startDate && consultaDate <= endDate;
          } else if (startDate) {
            return consultaDate >= startDate;
          } else if (endDate) {
            return consultaDate <= endDate;
          }
          return true;
        });
      }
      return false;
    })
    .filter(client => activeTab !== 1 || favorites.includes(client.id))
    .sort((a, b) => {
      if (sortOption === "recent") {
        const aDate = a.lastInteraction || (a.consultas?.[0]?.timestamp?.seconds || 0);
        const bDate = b.lastInteraction || (b.consultas?.[0]?.timestamp?.seconds || 0);
        return bDate - aDate;
      }
      if (sortOption === "name") return (a.company || "").localeCompare(b.company || "");
      if (sortOption === "consultas") return (b.numConsultas || 0) - (a.numConsultas || 0);
      return 0;
    });

  const statusColors = {
    "En proceso": "primary",
    "Resuelta": "success",
    "Pendiente": "warning",
    "Rechazado": "error"
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Barra superior con título */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: 2
        }}>
          <Typography variant="h4" fontWeight="bold" color="#1B5C94" gutterBottom>
            Información de Clientes
          </Typography>
        </Box>

        {/* Barra de búsqueda y ordenación */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Buscar clientes por nombre, email o contenido de consultas..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: quickSearch && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setQuickSearch("")}
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Botón para abrir el selector de rango de fechas */}
          <Button
            variant="outlined"
            startIcon={<DateRange />}
            onClick={handleDatePickerClick}
            sx={{ minWidth: 200 }}
          >
            {startDate && endDate ? (
              `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
            ) : startDate ? (
              `Desde ${startDate.toLocaleDateString()}`
            ) : endDate ? (
              `Hasta ${endDate.toLocaleDateString()}`
            ) : (
              "Filtrar por fecha"
            )}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Sort />}
            onClick={(e) => setAnchorElSort(e.currentTarget)}
            sx={{ minWidth: 120 }}
          >
            Ordenar
          </Button>
        </Box>

        {/* Popover para el selector de rango de fechas */}
        <Popover
          open={Boolean(datePickerAnchorEl)}
          anchorEl={datePickerAnchorEl}
          onClose={handleDatePickerClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          sx={{ p: 2 }}
        >
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <DatePicker
              label="Fecha inicio"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Typography variant="body1">a</Typography>
            <DatePicker
              label="Fecha fin"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1 }}>
            <Button onClick={handleDateRangeClear} size="small">
              Limpiar
            </Button>
          </Box>
        </Popover>

        {/* Menú de ordenación */}
        <Menu
          anchorEl={anchorElSort}
          open={Boolean(anchorElSort)}
          onClose={() => setAnchorElSort(null)}
        >
          <MenuItem
            onClick={() => { setSortOption("recent"); setAnchorElSort(null); }}
            selected={sortOption === "recent"}
          >
            Más recientes primero
          </MenuItem>
          <MenuItem
            onClick={() => { setSortOption("name"); setAnchorElSort(null); }}
            selected={sortOption === "name"}
          >
            Orden alfabético
          </MenuItem>
          <MenuItem
            onClick={() => { setSortOption("consultas"); setAnchorElSort(null); }}
            selected={sortOption === "consultas"}
          >
            Más consultas primero
          </MenuItem>
        </Menu>

        {/* Pestañas de categorización */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Todos" />
          <Tab label="Favoritos" icon={<Star fontSize="small" />} />
        </Tabs>

        {/* Tabla de clientes */}
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1B5C94" }}>
                <TableCell sx={{ color: "white", fontWeight: "bold", width: 50 }}></TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cliente</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Consultas activas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.map((client) => (
                <React.Fragment key={client.id}>
                  <TableRow
                    hover
                    onClick={() => handleRowClick(client.id, client.name)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: favorites.includes(client.id) ? '#fff8e1' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(client.id);
                        }}
                        size="small"
                      >
                        {favorites.includes(client.id) ? (
                          <Star color="warning" />
                        ) : (
                          <StarBorder />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: stringToColor(client.company)
                          }}
                        >
                          {client.company?.charAt(0)}
                        </Avatar>
                        {client.company}
                        {client.premium && (
                          <Chip
                            label="Premium"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      {client.numConsultas > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={client.numConsultas}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                          {client.consultas?.some(c => c.status === "Pendiente") && (
                            <Chip
                              label="Pendiente"
                              color="warning"
                              size="small"
                            />
                          )}
                        </Box>
                      ) : (
                        "0"
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                      <Collapse in={expandedClientId === client.id} timeout="auto" unmountOnExit>
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
                              onClick={() => fetchLastQuery(client.name)}
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
                              onClick={() => fetchLastFiveQueries(client.name)}
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
                                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
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
                                      <TableCell>
                                        <Chip
                                          label={consulta.status || "Sin estado"}
                                          color={statusColors[consulta.status] || "default"}
                                          size="small"
                                        />
                                      </TableCell>
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
                                                icon={<Attachment />}
                                                label={fileName}
                                                onClick={() => window.open(fileDownloadUrls[fileName], '_blank')}
                                                deleteIcon={<GetApp />}
                                                onDelete={fileDownloadUrls[fileName] ? () => window.open(fileDownloadUrls[fileName], '_blank') : undefined}
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

        {/* Resumen de resultados */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 2,
          p: 1,
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}>
          <Typography variant="body2">
            Mostrando {filteredClients.length} de {clients.length} clientes
          </Typography>
          <Typography variant="body2">
            {clients.filter(c => c.numConsultas > 0).length} clientes con consultas activas
          </Typography>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

// Función auxiliar para generar colores a partir de strings
function stringToColor(string) {
  if (!string) return '#1976d2';

  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

export default ClientsInfo;