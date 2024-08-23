import React, { useState, useEffect } from "react";
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
  Select,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  db,
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from "../firebaseConfig";
import "./VistaAsesorFormulario.css";

const VistaAsesorFormulario = () => {
  const [consultas, setConsultas] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("empresa");
  const [editType, setEditType] = useState("No asignado");
  const [currentId, setCurrentId] = useState(null);
  const [resolverDays, setResolverDays] = useState(0);

  useEffect(() => {
    const fetchConsultas = async () => {
      const querySnapshot = await getDocs(collection(db, "Consultas"));
      const consultasData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setConsultas(consultasData);
    };

    fetchConsultas();
  }, []);

  const handleToggleDetails = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
    if (expandedRow === id) {
      setEditType("");
      setCurrentId(null);
      setResolverDays(30);
    } else {
      const consulta = consultas.find((c) => c.id === id);
      setEditType(consulta.tipo || "");
      setCurrentId(id);
      setResolverDays(consulta.indicador || 30);
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSave = async () => {
    if (currentId) {
      // Update existing consulta
      const consultaRef = doc(db, "Consultas", currentId);
      await updateDoc(consultaRef, { tipo: editType, indicador: resolverDays });
      setConsultas(
        consultas.map((c) =>
          c.id === currentId
            ? { ...c, tipo: editType, indicador: resolverDays }
            : c
        )
      );
      setExpandedRow(null);
    } else {
      // Add new consulta
      await addDoc(collection(db, "Consultas"), {
        tipo: editType || "No asignado", // Default to "No asignado"
        indicador: resolverDays || 0, // Default to 0
        // Include other necessary fields
      });
      setConsultas([
        ...consultas,
        {
          tipo: editType || "No asignado",
          indicador: resolverDays || 0 /* other fields */,
        },
      ]);
      // Reset state after saving
      setEditType("No asignado");
      setResolverDays(0); // Reset to default value
    }
  };

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState("");

  const handleCommentToggle = () => {
    setShowCommentBox(!showCommentBox);
  };

  const handleCommentChange = (event) => {
    setComment(event.target.value);
  };

  // Optionally: you might want to handle saving or processing the comment
  const handleSaveComment = () => {
    // Implement the logic to save the comment
    console.log(comment);
    setComment(""); // Clear the comment after saving
    setShowCommentBox(false); // Hide the comment box
  };

  const sortedConsultas = consultas.sort((a, b) => {
    if (orderBy === "fecha_solicitud") {
      return order === "asc"
        ? a.fecha_solicitud.seconds - b.fecha_solicitud.seconds
        : b.fecha_solicitud.seconds - a.fecha_solicitud.seconds;
    }

    if (orderBy === "estado") {
      const statesOrder = ["Pendiente", "En proceso", "Resuelto"];
      return order === "asc"
        ? statesOrder.indexOf(a.estado) - statesOrder.indexOf(b.estado)
        : statesOrder.indexOf(b.estado) - statesOrder.indexOf(a.estado);
    }

    const aValue = a[orderBy] || "";
    const bValue = b[orderBy] || "";

    if (orderBy === "tipo") {
      const typesOrder = [
        "Asesoría técnica",
        "Clasificación arancelaria",
        "No asignado",
      ];
      return order === "asc"
        ? typesOrder.indexOf(a.tipo || "No asignado") -
            typesOrder.indexOf(b.tipo || "No asignado")
        : typesOrder.indexOf(b.tipo || "No asignado") -
            typesOrder.indexOf(a.tipo || "No asignado");
    }

    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <TableContainer component={Paper} className="table-container">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("empresa")}
                className={`sort-button ${
                  orderBy === "empresa" ? "active" : ""
                }`}
              >
                Cliente
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "empresa"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("tipo")}
                className={`sort-button ${orderBy === "tipo" ? "active" : ""}`}
              >
                Tipo de Consulta
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "tipo"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("fecha_solicitud")}
                className={`sort-button ${
                  orderBy === "fecha_solicitud" ? "active" : ""
                }`}
              >
                Fecha de Solicitud
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "fecha_solicitud"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
            </TableCell>
            <TableCell>
              <Button className="sort-button">Indicador</Button>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => handleRequestSort("estado")}
                className={`sort-button ${
                  orderBy === "estado" ? "active" : ""
                }`}
              >
                Estado
                <ExpandMoreIcon
                  style={{
                    transform:
                      orderBy === "estado"
                        ? order === "asc"
                          ? "rotate(0deg)"
                          : "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    fontSize: 16,
                  }}
                />
              </Button>
            </TableCell>
            <TableCell>Opciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedConsultas.map((consulta) => (
            <React.Fragment key={consulta.id}>
              <TableRow>
                <TableCell>{consulta.empresa}</TableCell>
                <TableCell>{consulta.tipo || "No asignado"}</TableCell>
                <TableCell>
                  {new Date(
                    consulta.fecha_solicitud.seconds * 1000
                  ).toLocaleString()}
                </TableCell>
                <TableCell>{consulta.indicador || 30} Días</TableCell>{" "}
                {/* Indicador column */}
                <TableCell>{consulta.estado}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleToggleDetails(consulta.id)}
                    className="expand-button"
                  >
                    <ExpandMoreIcon
                      style={{
                        transform:
                          expandedRow === consulta.id
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                        color: "primary.main",
                        fontSize: 20,
                      }}
                    />
                  </Button>
                </TableCell>
              </TableRow>
              {expandedRow === consulta.id && (
                <TableRow>
                  <TableCell colSpan={6} className="details-cell">
                    <Box className="details-box">
                      <Box className="details-info">
                        <Typography variant="h6">
                          <strong>Nombre y Apellido:</strong>{" "}
                          {consulta.nombre || "No disponible"}{" "}
                          {consulta.apellido || "No disponible"}
                        </Typography>
                        <Typography variant="h6" marginTop={2}>
                          <strong>Consulta:</strong>{" "}
                          {consulta.mensaje || "No disponible"}
                        </Typography>
                        {consulta.adjuntado && (
                          <Box marginTop={2}>
                            <Typography variant="h6">
                              <strong>Archivo Adjunto:</strong>
                            </Typography>
                            <Box display="flex" alignItems="center">
                              {consulta.adjuntado
                                .split(", ")
                                .map((fileName) => (
                                  <Box key={fileName} marginRight={2}>
                                    <a
                                      href={`path_to_your_storage/${fileName}`}
                                      download
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={`path_to_your_storage/${fileName}`}
                                        alt={fileName}
                                        className="file-thumbnail"
                                      />
                                    </a>
                                  </Box>
                                ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                      <Box className="details-actions">
                        <Box className="select-group">
                          <Box className="select-container">
                            <Typography variant="h6">
                              Tipo de Consulta
                            </Typography>
                            <Select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                              className="select-type"
                            >
                              <MenuItem value="No asignado">
                                No asignado
                              </MenuItem>
                              <MenuItem value="Asesoría técnica">
                                Asesoría técnica
                              </MenuItem>
                              <MenuItem value="Clasificación arancelaria">
                                Clasificación arancelaria
                              </MenuItem>
                            </Select>
                          </Box>
                          <Box className="select-container">
                            <Typography variant="h6">
                              Días para resolver consulta
                            </Typography>
                            <Select
                              value={resolverDays}
                              onChange={(e) => setResolverDays(e.target.value)}
                              className="select-type"
                            >
                              {[...Array(31).keys()].map((day) => (
                                <MenuItem key={day} value={day}>
                                  {day}
                                </MenuItem>
                              ))}
                            </Select>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          {/* Botón Guardar */}
                          <Button
                            variant="contained"
                            sx={{
                              backgroundColor: "#1B5C94",
                              color: "white",
                              borderRadius: "70px",
                              "&:hover": {
                                backgroundColor: "#145a8c",
                              },
                            }}
                          >
                            Guardar
                          </Button>

                          {/* Botón Cerrar */}
                          <Button
                            variant="contained"
                            sx={{
                              backgroundColor: "#1B5C94",
                              color: "white",
                              borderRadius: "70px",
                              "&:hover": {
                                backgroundColor: "#145a8c",
                              },
                            }}
                          >
                            Cerrar
                          </Button>

                          {/* Botón Agregar Comentario */}
                          <Button
                            variant="contained"
                            sx={{
                              backgroundColor: "#1B5C94",
                              color: "white",
                              borderRadius: "70px",
                              "&:hover": {
                                backgroundColor: "#145a8c",
                              },
                            }}
                          >
                            Agregar Comentario
                          </Button>
                        </Box>
                        {showCommentBox && (
                          <Box marginTop={2}>
                            <Typography variant="h6">
                              Agregar Comentario:
                            </Typography>
                            <textarea
                              value={comment}
                              onChange={handleCommentChange}
                              rows={4}
                              cols={50}
                              style={{ width: "100%", marginTop: 8 }}
                            />
                            <Button
                              onClick={handleSaveComment}
                              variant="contained"
                              color="primary"
                              style={{ marginTop: 8 }}
                            >
                              Guardar Comentario
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VistaAsesorFormulario;
