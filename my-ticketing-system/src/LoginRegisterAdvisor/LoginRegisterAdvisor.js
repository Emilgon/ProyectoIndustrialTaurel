import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { db, collection, getDocs, query, where } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Card, IconButton, Link, InputAdornment } from "@mui/material";
import Swal from "sweetalert2";
import { ArrowBack as ArrowBackIcon, Email as EmailIcon, Lock as LockIcon, Person as PersonIcon, Visibility, VisibilityOff } from "@mui/icons-material";
import "./LoginRegisterAdvisor.css";

/**
 * Componente para el inicio de sesión de los asesores.
 * Permite a los asesores ingresar sus credenciales para acceder al panel de control.
 * @returns {JSX.Element} El elemento JSX que representa el formulario de inicio de sesión del asesor.
 */
const LoginRegisterAdvisor = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Asesor logueado con éxito:", userCredential.user);

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email), where("role", "==", "advisor"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "El correo electrónico no está registrado o la contraseña es incorrecta.",
        });
        return;
      }

      navigate("/asesor-control");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "El correo electrónico no está registrado o la contraseña es incorrecta.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo.",
        });
      }
    }
  };

  return (
    <Box sx={{ 
      display: "flex", 
      minHeight: "100vh",
      backgroundColor: "#f5f5f5"
    }}>
      {/* Sección de la imagen (40%) - Izquierda */}
      <Box sx={{ 
        width: "40%",
        display: { xs: "none", md: "flex" },
        backgroundColor: "#1B5C94",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}>
        <img 
          src="/images/imagenloginasesor.png"
          alt="Login Asesor" 
          style={{ 
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center"
          }} 
        />
      </Box>

      {/* Sección del login (60%) - Derecha */}
      <Box sx={{ 
        width: { xs: "100%", md: "60%" },
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        padding: 4,
        backgroundColor: "white"
      }}>
        <Card sx={{ 
          p: 6,
          boxShadow: 3, 
          borderRadius: 3, 
          width: "100%",
          height: "100%", 
          maxWidth: 500,
          maxHeight: 390,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          backgroundColor: '#f5f5f5',
        }}>
          {/* Header */}
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mb: 4,
            px: 0
          }}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                color: "black",
                fontSize: "2rem",
                flexGrow: 1,
                textAlign: 'center'
              }}
            >
              Inicio de sesión asesor
            </Typography>
            <Box sx={{ width: 48 }} />
          </Box>

          {/* Formulario */}
          <Box sx={{ 
            mb: 4
          }}>
            <TextField
              label="E-MAIL"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              fullWidth
              margin="normal"
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  padding: '14px 14px 14px 0',
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem',
                }
              }}
              InputProps={{
                startAdornment: <EmailIcon sx={{ color: "#1B5C94", mr: 1.5, fontSize: "1.5rem" }} />,
              }}
            />
            <TextField
              label="PASSWORD"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  padding: '14px 14px 14px 0',
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1.1rem',
                }
              }}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: "#1B5C94", mr: 1.5, fontSize: "1.5rem" }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Botón de Iniciar Sesión */}
          <Button
            variant="contained"
            onClick={handleLogin}
            fullWidth
            sx={{
              backgroundColor: "#1B5C94",
              color: "white",
              borderRadius: "12px",
              fontSize: "1.2rem",
              height: "56px",
              "&:hover": {
                backgroundColor: "#145a8c",
              },
              mb: 2
            }}
          >
            Iniciar Sesión
          </Button>

          {/* Enlace "Soy Cliente" */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mt: 3
          }}>
            <PersonIcon sx={{ color: "#1B5C94", mr: 1, fontSize: "1.2rem" }} />
            <Link 
              component="button"
              variant="body1"
              onClick={() => navigate('/menu')}
              sx={{
                color: "#1B5C94",
                fontSize: '1.1rem',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
            >
              SOY CLIENTE
            </Link>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default LoginRegisterAdvisor;
