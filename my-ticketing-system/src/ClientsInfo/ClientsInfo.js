import React from "react";
import { Box, Button, TextField, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Collapse, Chip, IconButton, Tooltip, Popover, InputAdornment } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AttachmentIcon from "@mui/icons-material/Attachment";
import GetAppIcon from "@mui/icons-material/GetApp";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import useClientsInfoController from "../hooks/useClientsInfoController";

const ClientsInfo = () => {
  const {
    clients,
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
  } = useClientsInfoController();

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) {
      return "Fecha no disponible";
    }
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <AttachmentIcon />;
      default:
        return <AttachmentIcon />;
    }
  };

  const [anchorElSearch, setAnchorElSearch] = React.useState(null);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="#1B5C94" gutterBottom>
          Información de Clientes
        </Typography>
        <Tooltip title="Salir al panel de control" arrow>
          <IconButton
            onClick={() => window.location.href = "/asesor-control"}
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
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                <Button
                  onClick={(event) => setAnchorElSearch(event.currentTarget)}
                  sx={{ color: "white", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  Cliente
                  {searchClient && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#4CAF50",
                        display: "block"
                      }}
                    />
                  )}
                </Button>
                <Popover
                  open={Boolean(anchorElSearch)}
                  anchorEl={anchorElSearch}
                  onClose={() => setAnchorElSearch(null)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                >
                  <Box sx={{ p: 2, width: 250 }}>
                    <TextField
                      autoFocus
                      fullWidth
                      size="small"
                      variant="outlined"
                      placeholder="Buscar cliente..."
                      value={searchClient}
                      onChange={(e) => setSearchClient(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        endAdornment: searchClient && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setSearchClient("")}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Popover>
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Consultas activas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <React.Fragment key={client.id}>
                <TableRow
                  hover
                  onClick={() => handleRowClick(client.id, client.name)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{client.company}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    {client.numConsultas > 0 ? (
                      <Chip
                        label={client.numConsultas}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    ) : (
                      "0"
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
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
                                        color={
                                          consulta.status === "En proceso" ? "primary" :
                                            consulta.status === "Completado" ? "success" :
                                              "default"
                                        }
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
                                              icon={<AttachmentIcon />}
                                              label={fileName}
                                              onClick={() => window.open(fileDownloadUrls[fileName], '_blank')}
                                              deleteIcon={<GetAppIcon />}
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
    </Box>
  );
};

export default ClientsInfo;
