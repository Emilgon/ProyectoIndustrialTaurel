import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person'; // Icono de persona
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Icono de administrador
import './Menu.css';

const Menu = () => {
  const navigate = useNavigate();

  return (
    <Box className="menu-container">
      <Button
        className="menu-button"
        onClick={() => navigate('/login')} // Redirige al login de cliente
      >
        <Box className="button-content">
          <PersonIcon fontSize="large" />
          <Typography variant="h5" component="h2">
            Cliente
          </Typography>
        </Box>
      </Button>

      <Button
        className="menu-button"
        onClick={() => navigate('/login-asesor')} // Redirige al login de asesor
      >
        <Box className="button-content">
          <AdminPanelSettingsIcon fontSize="large" />
          <Typography variant="h5" component="h2">
            Asesor
          </Typography>
        </Box>
      </Button>
    </Box>
  );
};

export default Menu;