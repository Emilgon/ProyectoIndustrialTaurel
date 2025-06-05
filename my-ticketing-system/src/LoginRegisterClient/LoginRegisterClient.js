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
    <Card sx={{ 
      p: 6, // Aumentado de p:4 a p:6
      boxShadow: 3, 
      borderRadius: 3, // Aumentado ligeramente
      width: '100%', 
      maxWidth: 500, // Aumentado de 400 a 500
      margin: 'auto',
      backgroundColor: '#f5f5f5', // Color de fondo más claro
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 // Aumentado de mb:3 a mb:4
      }}>
        {!hideBackButton && (
          <IconButton 
            onClick={() => navigate('/menu')}
            sx={{ fontSize: '1.5rem' }} // Tamaño aumentado del icono
          >
            <ArrowBackIcon fontSize="inherit" />
          </IconButton>
        )}
        <Typography 
          variant="h4" // Cambiado de h5 a h4
          fontWeight="bold" 
          sx={{ 
            flexGrow: 1, 
            textAlign: 'center',
            fontSize: '2rem' // Tamaño de fuente aumentado
          }}
        >
          Inicio de sesión cliente
        </Typography>
        {!hideBackButton && <Box sx={{ width: 48 }} />} {/* Aumentado de 40 a 48 */}
      </Box>

      <Box sx={{ mb: 4 }}> {/* Aumentado de mb:3 a mb:4 */}
        <TextField
          label="E-MAIL"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '1.1rem', // Tamaño de fuente aumentado
              padding: '14px 14px 14px 0', // Padding ajustado
            },
            '& .MuiInputLabel-root': {
              fontSize: '1.1rem', // Tamaño de etiqueta aumentado
            }
          }}
          InputProps={{
            startAdornment: <EmailIcon sx={{ color: '#1B5C94', mr: 1.5, fontSize: '1.5rem' }} />, // Icono aumentado
          }}
        />
        <TextField
          label="PASSWORD"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '1.1rem', // Tamaño de fuente aumentado
              padding: '14px 14px 14px 0', // Padding ajustado
            },
            '& .MuiInputLabel-root': {
              fontSize: '1.1rem', // Tamaño de etiqueta aumentado
            }
          }}
          InputProps={{
            startAdornment: <LockIcon sx={{ color: '#1B5C94', mr: 1.5, fontSize: '1.5rem' }} />, // Icono aumentado
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
          height: '56px', // Aumentado de 50px a 56px
          fontSize: '1.2rem', // Aumentado de 1.1rem a 1.2rem
          mb: 2 // Margen inferior añadido
        }}
      >
        Iniciar Sesión
      </Button>

      <Box sx={{ mt: 3, textAlign: 'center' }}> {/* Aumentado de mt:2 a mt:3 */}
        <Button
          variant="text"
          onClick={() => navigate('/formulario-cliente')}
          sx={{ 
            color: '#1B5C94',
            fontSize: '1.1rem' // Tamaño de fuente aumentado
          }}
        >
          ¿No tienes cuenta? Regístrate
        </Button>
      </Box>

      {showAdvisorOption && (
        <Box sx={{ mt: 3, textAlign: 'center' }}> {/* Aumentado de mt:2 a mt:3 */}
          <Button
            variant="text"
            onClick={onAdvisorClick}
            sx={{ 
              color: '#1B5C94',
              fontSize: '1.1rem' // Tamaño de fuente aumentado
            }}
            startIcon={<AdminPanelSettingsIcon sx={{ fontSize: '1.5rem' }} />} // Icono aumentado
          >
            Soy asesor
          </Button>
        </Box>
      )}
    </Card>
  );
};

export default LoginRegisterClient;