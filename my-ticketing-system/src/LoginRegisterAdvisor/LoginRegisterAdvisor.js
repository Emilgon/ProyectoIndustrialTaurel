import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db, collection, addDoc, getDocs, updateDoc, onSnapshot, query, where } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Card, IconButton } from "@mui/material";
import Swal from "sweetalert2";
import { ArrowBack as ArrowBackIcon, Person as PersonIcon, Email as EmailIcon, Lock as LockIcon } from "@mui/icons-material";
import "./LoginRegisterAdvisor.css";

const LoginRegisterAdvisor = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

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

  const handleRegister = async () => {
    setShowForm(true);
  };

  // Función para crear un nuevo asesor
  const handleCreateUser = async () => {
    if (name.trim() === "") {
      setNameError("El campo nombre no puede estar vacío.");
      return;
    }
    if (email.trim() === "") {
      setEmailError("El campo correo electrónico no puede estar vacío.");
      return;
    }
    if (password.trim() === "") {
      setEmailError("El campo contraseña no puede estar vacío.");
      return;
    }

    try {
      // Crear el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Asesor registrado con éxito:", userCredential.user);

      // Obtener el número de consultas en Firestore
      const consultasRef = collection(db, "Consults");
      const consultasSnapshot = await getDocs(consultasRef);
      const numConsultas = consultasSnapshot.docs.length;

      // Agregar el asesor a Firestore con el número de consultas
      const advisorRef = await addDoc(collection(db, "Advisors"), {
        name: name,
        email: email,
        request: numConsultas, // Asignar el número de consultas al atributo request
      });

      // Actualizar el atributo request del asesor cada vez que se agrega una nueva consulta
      onSnapshot(consultasRef, (snapshot) => {
        const newNumConsultas = snapshot.docs.length;
        updateDoc(advisorRef, { request: newNumConsultas });
      });

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: "success",
        title: "Asesor registrado con éxito",
        text: "Bienvenido a nuestra plataforma",
      });

      // Redirigir al asesor a /asesor-control
      navigate("/asesor-control");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setEmailError("El correo electrónico ya está en uso.");
      } else {
        console.error("Error al registrar asesor:", error);
      }
    }
  };

  if (showForm) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2, width: "100%", maxWidth: 400 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <IconButton onClick={() => setShowForm(false)}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              Registro de Asesor
            </Typography>
            <Box sx={{ width: 40 }} /> {/* Espacio para alinear el título */}
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Nombre"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              variant="outlined"
              fullWidth
              margin="normal"
              error={nameError !== ""}
              helperText={nameError}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "#1B5C94", mr: 1 }} />,
              }}
            />
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
            onClick={handleCreateUser}
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
            Registrarme
          </Button>
        </Card>
      </Box>
    );
  } else {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2, width: "100%", maxWidth: 400 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <IconButton onClick={() => navigate("/menu")}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              Login de Asesor
            </Typography>
            <Box sx={{ width: 40 }} /> {/* Espacio para alinear el título */}
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Correo electrónico"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              variant="text"
              onClick={handleRegister}
              sx={{ color: "#1B5C94" }}
            >
              ¿No tienes cuenta? Regístrate
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }
};

export default LoginRegisterAdvisor;