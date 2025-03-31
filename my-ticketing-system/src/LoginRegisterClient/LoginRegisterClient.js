import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db, collection, query, where, getDocs } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Card, IconButton } from '@mui/material';
import Swal from 'sweetalert2';
import { ArrowBack as ArrowBackIcon, Lock as LockIcon, Email as EmailIcon, AdminPanelSettings as AdminPanelSettingsIcon } from '@mui/icons-material';
import './LoginRegisterClient.css';

const LoginRegisterClient = ({ showAdvisorOption = false, onAdvisorClick, hideBackButton = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario logueado con éxito:', userCredential.user);

      const clientsRef = collection(db, 'Clients');
      const q = query(clientsRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El correo electrónico no está registrado o la contraseña es incorrecta.',
        });
        return;
      }

      navigate('/vista-cliente');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);

      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El correo electrónico no está registrado o la contraseña es incorrecta.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al iniciar sesión. Por favor intente nuevamente.',
        });
      }
    }
  };

  return (
    <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2, width: '100%', maxWidth: 400 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        {!hideBackButton && (
          <IconButton onClick={() => navigate('/menu')}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1, textAlign: 'center' }}>
          Inicio de sesión
        </Typography>
        {!hideBackButton && <Box sx={{ width: 40 }} />}
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="E-MAIL"
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
          label="PASSWORD"
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
          height: '50px',
          fontSize: '1.1rem',
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

      {showAdvisorOption && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={onAdvisorClick}
            sx={{ color: '#1B5C94' }}
            startIcon={<AdminPanelSettingsIcon />}
          >
            Soy asesor
          </Button>
        </Box>
      )}
    </Card>
  );
};

export default LoginRegisterClient;