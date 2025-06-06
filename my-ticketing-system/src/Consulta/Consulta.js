import { useState } from "react";
import { Box, Button, TextField, Typography, Card, CardContent, Input, List, ListItem, ListItemIcon, ListItemText, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import GetAppIcon from "@mui/icons-material/GetApp";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import useConsultaController from "../hooks/useConsultaController";
import Swal from "sweetalert2";

const Consulta = () => {
  const [affair, setAffair] = useState("");
  const {
    mensaje,
    setMensaje,
    archivo,
    preview,
    handleArchivoChange,
    handleEnviarConsulta
  } = useConsultaController();

  const navigate = useNavigate();

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <PictureAsPdfIcon />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon />;
      case "doc":
      case "docx":
        return <DescriptionIcon />;
      default:
        return <InsertDriveFileIcon />;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await handleEnviarConsulta(mensaje, archivo, affair);
    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Consulta enviada con éxito",
      });
      setAffair("");
      setMensaje("");
    } else {
      alert("Error al enviar consulta: " + (result.error?.message || ""));
    }
  };

  const navigateToVistaCliente = () => {
    navigate("/vista-cliente");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: 2,
      }}
    >
      <Card sx={{
        width: "90%", // Aumentado de 80% a 90%
        maxWidth: 1000, // Aumentado de 700 a 1000
        minHeight: 700, // Aumentado de 500 a 700
        boxShadow: 6,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column"
      }}>
        <Box
          sx={{
            backgroundColor: "#1B5C94",
            padding: 3, // Aumentado de 2 a 3
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <IconButton
            onClick={navigateToVistaCliente}
            sx={{ color: "white" }}
            aria-label="volver"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ flexGrow: 1, textAlign: "center" }}> {/* Cambiado de h5 a h4 */}
            TAUREL CONSULTAS
          </Typography>
        </Box>
        <CardContent sx={{ padding: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}> {/* Aumentado padding de 3 a 4 */}
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
            <Box sx={{ flexGrow: 1 }}>
              <TextField
                label="Asunto"
                value={affair}
                onChange={(e) => setAffair(e.target.value)}
                variant="outlined"
                fullWidth
                sx={{ mb: 4, fontSize: "1.2rem" }} // Aumentado mb de 3 a 4
                required
                InputProps={{
                  style: {
                    fontSize: "1.2rem" // Tamaño de fuente aumentado
                  }
                }}
                InputLabelProps={{
                  style: {
                    fontSize: "1.2rem" // Tamaño de etiqueta aumentado
                  }
                }}
              />
              <TextField
                label="Mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                variant="outlined"
                multiline
                rows={8} // Aumentado de 5 a 8
                fullWidth
                sx={{ mb: 4, fontSize: "1.2rem" }} // Aumentado mb de 3 a 4
                required
                InputProps={{
                  style: {
                    fontSize: "1.2rem" // Tamaño de fuente aumentado
                  }
                }}
                InputLabelProps={{
                  style: {
                    fontSize: "1.2rem" // Tamaño de etiqueta aumentado
                  }
                }}
              />
              <Input
                type="file"
                onChange={handleArchivoChange}
                id="file-input"
                style={{ display: "none" }}
              />
              <label htmlFor="file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFileIcon fontSize="large" />} // Aumentado tamaño del icono
                  sx={{
                    mb: 4, // Aumentado de 3 a 4
                    borderColor: "#1B5C94",
                    color: "#1B5C94",
                    "&:hover": {
                      borderColor: "#145a8c",
                      backgroundColor: "#e3f2fd",
                    },
                    transition: "all 0.3s ease",
                    fontSize: "1.2rem", // Tamaño de fuente aumentado
                    padding: "12px 24px" // Aumentado padding
                  }}
                >
                  Adjuntar archivo
                </Button>
              </label>
              {archivo && (
                <List
                  sx={{
                    border: "1px solid #1B5C94",
                    borderRadius: 2,
                    mb: 4, // Aumentado de 3 a 4
                    maxWidth: 600, // Aumentado de 400 a 600
                    padding: 2, // Aumentado de 1 a 2
                  }}
                >
                  <ListItem
                    sx={{
                      "&:hover": {
                        backgroundColor: "#e3f2fd",
                        cursor: "pointer",
                      },
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon sx={{ color: "#1B5C94", fontSize: "2rem" }}> {/* Tamaño de icono aumentado */}
                      {getFileIcon(archivo.name)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={archivo.name} 
                      primaryTypographyProps={{ style: { fontSize: "1.2rem" } }} // Tamaño de texto aumentado
                    />
                    <IconButton
                      component="a"
                      href={preview}
                      download={archivo.name}
                      rel="noopener noreferrer"
                      sx={{ color: "#1B5C94", fontSize: "2rem" }} // Tamaño de icono aumentado
                    >
                      <GetAppIcon fontSize="large" /> {/* Tamaño de icono aumentado */}
                    </IconButton>
                  </ListItem>
                </List>
              )}
            </Box>
            <Button
              variant="contained"
              type="submit"
              fullWidth
              startIcon={<SendIcon fontSize="large" />} // Aumentado tamaño del icono
              sx={{
                backgroundColor: "#1B5C94",
                color: "white",
                borderRadius: 2,
                fontWeight: "bold",
                fontSize: "1.3rem", // Aumentado de 1rem a 1.3rem
                padding: "16px 0", // Aumentado padding
                transition: "background-color 0.3s ease",
                "&:hover": {
                  backgroundColor: "#145a8c",
                },
              }}
            >
              Enviar consulta
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Consulta;