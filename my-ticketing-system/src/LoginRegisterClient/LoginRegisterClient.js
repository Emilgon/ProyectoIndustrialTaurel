import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db, collection, query, where, getDocs } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Card, IconButton, InputAdornment } from '@mui/material';
import Swal from 'sweetalert2';
import { ArrowBack as ArrowBackIcon, Lock as LockIcon, Email as EmailIcon, AdminPanelSettings as AdminPanelSettingsIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import './LoginRegisterClient.css';

const LoginRegisterClient = ({ showAdvisorOption = false, onAdvisorClick, hideBackButton = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

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
    <Card sx={{ 
      p: 6,
      boxShadow: 3, 
      borderRadius: 3,
      width: '100%', 
      maxWidth: 500,
      margin: 'auto',
      backgroundColor: '#f5f5f5',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4
      }}>
        {!hideBackButton && (
          <IconButton 
            onClick={() => navigate('/menu')}
            sx={{ fontSize: '1.5rem' }}
          >
            <ArrowBackIcon fontSize="inherit" />
          </IconButton>
        )}
        <Typography 
          variant="h4"
          fontWeight="bold" 
          sx={{ 
            flexGrow: 1, 
            textAlign: 'center',
            fontSize: '2rem'
          }}
        >
          Inicio de sesión cliente
        </Typography>
        {!hideBackButton && <Box sx={{ width: 48 }} />}
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          label="E-MAIL"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            startAdornment: <EmailIcon sx={{ color: '#1B5C94', mr: 1.5, fontSize: '1.5rem' }} />,
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
            startAdornment: <LockIcon sx={{ color: '#1B5C94', mr: 1.5, fontSize: '1.5rem' }} />,
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
          height: '56px',
          fontSize: '1.2rem',
          mb: 2
        }}
      >
        Iniciar Sesión
      </Button>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="text"
          onClick={() => navigate('/formulario-cliente')}
          sx={{ 
            color: '#1B5C94',
            fontSize: '1.1rem'
          }}
        >
          ¿No tienes cuenta? Regístrate
        </Button>
      </Box>

      {showAdvisorOption && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={onAdvisorClick}
            sx={{ 
              color: '#1B5C94',
              fontSize: '1.1rem'
            }}
            startIcon={<AdminPanelSettingsIcon sx={{ fontSize: '1.5rem' }} />}
          >
            Soy asesor
          </Button>
        </Box>
      )}
    </Card>
  );
};

export default LoginRegisterClient;