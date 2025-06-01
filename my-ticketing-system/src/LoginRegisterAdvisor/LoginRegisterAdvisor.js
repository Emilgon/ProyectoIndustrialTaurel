import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { db, collection, getDocs, query, where } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Card, IconButton } from "@mui/material";
import Swal from "sweetalert2";
import { ArrowBack as ArrowBackIcon, Email as EmailIcon, Lock as LockIcon } from "@mui/icons-material";
import "./LoginRegisterAdvisor.css";

const LoginRegisterAdvisor = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async () => {
    try {
      // Iniciar sesión con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Asesor logueado con éxito:", userCredential.user);

      // Verificar si el asesor está registrado en Firestore
      const advisorsRef = collection(db, "Advisors");
      const q = query(advisorsRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Si no hay resultados, el asesor no está registrado
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "El correo electrónico no está registrado o la contraseña es incorrecta.",
        });
        return; // Detener la ejecución
      }

      // Si el asesor está registrado, redirigir a /asesor-control
      navigate("/asesor-control");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      // Manejo de errores específicos
      if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "El correo electrónico no está registrado o la contraseña es incorrecta.",
        });
      } else {
        // Manejo de otros errores
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo.",
        });
      }
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2, width: "100%", maxWidth: 400 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <IconButton onClick={() => navigate("/menu")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            Inicio de sesión Asesor
          </Typography>
          <Box sx={{ width: 40 }} /> {/* Espacio para alinear el título */}
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Correo electrónico"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            variant="outlined"
            fullWidth
            margin="normal"
            error={emailError !== ""}
            helperText={emailError}
            InputProps={{
              startAdornment: <EmailIcon sx={{ color: "#1B5C94", mr: 1 }} />,
            }}
          />
          <TextField
            label="Contraseña"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            InputProps={{
              startAdornment: <LockIcon sx={{ color: "#1B5C94", mr: 1 }} />,
            }}
          />
        </Box>

        <Button
          variant="contained"
          onClick={handleLogin}
          fullWidth
          sx={{
            backgroundColor: "#1B5C94",
            color: "white",
            borderRadius: "12px",
            "&:hover": {
              backgroundColor: "#145a8c",
            },
          }}
        >
          Iniciar Sesión
        </Button>
      </Card>
    </Box>
  );
};

export default LoginRegisterAdvisor;