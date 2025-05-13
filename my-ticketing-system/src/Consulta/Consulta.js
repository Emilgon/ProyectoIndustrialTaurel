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
      alert("Consulta enviada con éxito");
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
        width: "80%",
        maxWidth: 700,
        minHeight: 500,
        boxShadow: 6,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column"
      }}>
        <Box
          sx={{
            backgroundColor: "#1B5C94",
            padding: 2,
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
          <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1, textAlign: "center" }}>
            TAUREL CONSULTAS
          </Typography>
        </Box>
        <CardContent sx={{ padding: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
            <Box sx={{ flexGrow: 1 }}>
              <TextField
                label="Asunto"
                value={affair}
                onChange={(e) => setAffair(e.target.value)}
                variant="outlined"
                fullWidth
                sx={{ mb: 3 }}
                required
              />
              <TextField
                label="Mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                variant="outlined"
                multiline
                rows={5}
                fullWidth
                sx={{ mb: 3 }}
                required
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
                  startIcon={<AttachFileIcon />}
                  sx={{
                    mb: 3,
                    borderColor: "#1B5C94",
                    color: "#1B5C94",
                    "&:hover": {
                      borderColor: "#145a8c",
                      backgroundColor: "#e3f2fd",
                    },
                    transition: "all 0.3s ease",
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
                    mb: 3,
                    maxWidth: 400,
                    padding: 1,
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
                    <ListItemIcon sx={{ color: "#1B5C94" }}>
                      {getFileIcon(archivo.name)}
                    </ListItemIcon>
                    <ListItemText primary={archivo.name} />
                    <IconButton
                      component="a"
                      href={preview}
                      download={archivo.name}
                      rel="noopener noreferrer"
                      sx={{ color: "#1B5C94" }}
                    >
                      <GetAppIcon />
                    </IconButton>
                  </ListItem>
                </List>
              )}
            </Box>
            <Button
              variant="contained"
              type="submit"
              fullWidth
              startIcon={<SendIcon />}
              sx={{
                backgroundColor: "#1B5C94",
                color: "white",
                borderRadius: 2,
                fontWeight: "bold",
                fontSize: "1rem",
                padding: "12px 0",
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
