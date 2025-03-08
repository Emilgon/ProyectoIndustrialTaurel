import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db, collection, query, where, getDocs } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Card, Avatar, IconButton } from '@mui/material';
import Swal from 'sweetalert2';
import { ArrowBack as ArrowBackIcon, Lock as LockIcon, Email as EmailIcon } from '@mui/icons-material';
import './LoginRegisterClient.css';

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
      const clientsRef = collection(db, 'Clients');
      const q = query(clientsRef, where('email', '==', email));
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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2, width: '100%', maxWidth: 400 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/menu')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            Login
          </Typography>
          <Box sx={{ width: 40 }} /> {/* Espacio para alinear el título */}
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: <EmailIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: <LockIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
        </Box>

        <Button
          variant="contained"
          onClick={handleLogin}
          fullWidth
          sx={{
            backgroundColor: '#1B5C94',
            color: 'white',
            borderRadius: '12px',
            '&:hover': {
              backgroundColor: '#145a8c',
            },
          }}
        >
          Iniciar Sesión
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={() => navigate('/formulario-cliente')}
            sx={{ color: '#1B5C94' }}
          >
            ¿No tienes cuenta? Regístrate
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginRegisterClient;