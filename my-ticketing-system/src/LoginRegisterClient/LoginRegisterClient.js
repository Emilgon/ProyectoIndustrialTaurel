import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db, collection, query, where, getDocs } from '../firebaseConfig'; // Importaciones corregidas
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography } from '@mui/material';
import './LoginRegisterClient.css';
import Swal from 'sweetalert2';

const LoginRegisterClient = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async () => {
    try {
      // Iniciar sesión con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario logueado con éxito:', userCredential.user);

      // Verificar si el cliente está registrado en Firestore
      const clientsRef = collection(db, 'Clients'); // Referencia a la colección Clients
      const q = query(clientsRef, where('email', '==', email)); // Consulta para buscar el correo
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Si no hay resultados, el cliente no está registrado
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El correo electrónico no está registrado o la contraseña es incorrecta.',
        });
        return; // Detener la ejecución
      }

      // Si el cliente está registrado, redirigir a la página de inicio
      navigate('/vista-cliente');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);

      // Manejo de errores específicos
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El correo electrónico no está registrado o la contraseña es incorrecta.',
        });
      } else {
        // Manejo de otros errores
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El correo electrónico no está registrado o la contraseña es incorrecta.',
        });
      }
    }
  };

  return (
    <Box className="login-container">
      <Button variant="text" onClick={() => navigate('/menu')}>
        <i className="fas fa-arrow-left"></i> Volver
      </Button>
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
    </Box>
  );
};

export default LoginRegisterClient;