import { useState } from "react";
import { Box, Button, TextField, Typography, Card, CardContent, Input, List, ListItem, ListItemIcon, ListItemText, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import GetAppIcon from "@mui/icons-material/GetApp";
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
    } else {
      alert("Error al enviar consulta: " + (result.error?.message || ""));
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Card sx={{ width: "80%", height: "80%", boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Enviar Consulta
          </Typography>
          <form onSubmit={onSubmit}>
            <TextField
              label="Asunto"
              value={affair}
              onChange={(e) => setAffair(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ mb: 2 }}
              required
            />
            <TextField
              label="Mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              variant="outlined"
              multiline
              rows={4}
              fullWidth
              sx={{ mb: 2 }}
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
                sx={{ mb: 2 }}
              >
                Adjuntar archivo
              </Button>
            </label>
            {archivo && (
              <List>
                <ListItem>
                  <ListItemIcon>{getFileIcon(archivo.name)}</ListItemIcon>
                  <ListItemText primary={archivo.name} />
                  <IconButton
                    component="a"
                    href={preview}
                    download={archivo.name}
                    rel="noopener noreferrer"
                  >
                    <GetAppIcon />
                  </IconButton>
                </ListItem>
              </List>
            )}
            <Button
              variant="contained"
              type="submit"
              fullWidth
              startIcon={<SendIcon />}
              sx={{
                backgroundColor: "#1B5C94",
                color: "white",
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
