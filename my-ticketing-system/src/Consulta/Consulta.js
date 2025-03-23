import React, { useState } from "react";
import { db, collection, addDoc, auth, getDocs, storage } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importa las funciones de Firebase Storage
import Swal from "sweetalert2";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Input,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"; // Ícono para PDF
import ImageIcon from "@mui/icons-material/Image"; // Ícono para imágenes
import DescriptionIcon from "@mui/icons-material/Description"; // Ícono para documentos
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile"; // Ícono para archivos genéricos
import GetAppIcon from "@mui/icons-material/GetApp"; // Ícono de descarga

const Consulta = () => {
  const auth = getAuth();
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleEnviarConsulta = async () => {
    try {
      let attachmentURL = "";

      // Subir el archivo a Firebase Storage si existe
      if (archivo) {
        const storageRef = ref(storage, `archivos/${archivo.name}`); // Usa storage desde firebaseConfig
        await uploadBytes(storageRef, archivo); // Sube el archivo
        attachmentURL = await getDownloadURL(storageRef); // Obtén la URL de descarga
      }

      // Guardar la consulta en Firestore
      const user = auth.currentUser;
      if (user) {
        const userRef = collection(db, "Clients");
        const querySnapshot = await getDocs(userRef);
        const userData = querySnapshot.docs.find(
          (doc) => doc.data().email === user.email
        );
        if (userData) {
          const company = userData.data().company;
          const name = userData.data().name;
          const clientId = userData.id; // Obtén el ID del cliente

          await addDoc(collection(db, "Consults"), {
            name: name,
            company: company,
            type: null, // Cambiado para que muestre "No Asignado"
            star_date: new Date(),
            indicator: null,
            status: "Pendiente",
            email: user.email,
            messageContent: mensaje,
            attachment: attachmentURL,
            timestamp: serverTimestamp(),
            clientId: clientId,
            alertShown: false
          });
        }
      }

      // Limpiar el formulario
      setMensaje("");
      setArchivo(null);
      setPreview(null);

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: "success",
        title: "Consulta enviada",
        text: "Tu consulta ha sido enviada con éxito",
      });
    } catch (error) {
      console.error("Error al enviar consulta:", error);
      Swal.fire({
        icon: "error",
        title: "Error al enviar consulta",
        text: "Hubo un error al enviar tu consulta",
      });
    }
  };

  const handleArchivoChange = (e) => {
    const archivoSeleccionado = e.target.files[0];
    setArchivo(archivoSeleccionado);
    const archivoUrl = URL.createObjectURL(archivoSeleccionado);
    setPreview(archivoUrl);
  };

  // Función para obtener el ícono según el tipo de archivo
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
          <TextField
            label="Mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            variant="outlined"
            multiline
            rows={4}
            fullWidth
            sx={{ mb: 2 }}
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
            onClick={handleEnviarConsulta}
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default Consulta;