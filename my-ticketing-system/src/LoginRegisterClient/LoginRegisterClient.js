import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Link } from '@mui/material';
import './LoginRegisterClient.css';
import Swal from 'sweetalert2';

const LoginRegisterClient = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const auth = getAuth();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario logueado con éxito:', userCredential.user);
      navigate('/vista-cliente'); // Redirige al usuario a la página de inicio
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        Swal.fire({
          icon: 'error',
          title: 'Error de inicio de sesión',
          text: 'El correo electrónico o la contraseña son incorrectos. Por favor, inténtalo de nuevo.',
        });
      } else {
        console.error('Error al iniciar sesión:', error);
      }
    }
  };

  return (
    <Box className="login-container">
      <Box className="login-box">
        <Typography variant="h4" component="h1">
          Login
        </Typography>
        <Box className="login-form">
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" onClick={handleLogin}>
            Login
          </Button>
          <Button variant="text" onClick={() => navigate('/formulario-cliente')}>
            ¿No tienes cuenta? Regístrate
          </Button>
        </Box>
      </Box>
      <Link to="/asesor" style={{ textDecoration: 'none' }}>
        <Button variant="text" onClick={() => navigate('/asesor')}
          color="primary"
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            margin: 20,
          }}
        >
          SOY ASESOR
        </Button>
      </Link>
    </Box>

  );
};

export default LoginRegisterClient;