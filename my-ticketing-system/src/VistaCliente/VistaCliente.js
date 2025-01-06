import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db, collection, getDocs } from '../firebaseConfig';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './VistaCliente.css';

const VistaCliente = () => {
  const [userData, setUserData] = useState({});
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const userId = user.uid;
          const userRef = collection(db, 'Clients');
          const querySnapshot = getDocs(userRef);
          querySnapshot.then((snapshot) => {
            snapshot.forEach((doc) => {
              if (doc.data().email === user.email) {
                setUserData(doc.data());
              }
            });
          });
        }
      });
    };
    fetchUserData();
  }, []);

  return (
    <Box className="vista-cliente-box">
      <Typography variant="h4" component="h1">
        Bienvenido, {userData.name}
      </Typography>
      <Box className="vista-cliente-data">
        <Typography variant="h6" component="p">
          Dirección: {userData.address}
        </Typography>
        <Typography variant="h6" component="p">
          Empresa/Compañía: {userData.company}
        </Typography>
        <Typography variant="h6" component="p">
          Rol en la compañía: {userData.company_role}
        </Typography>
        <Typography variant="h6" component="p">
          Correo electrónico: {userData.email}
        </Typography>
        <Typography variant="h6" component="p">
          Teléfono: {userData.phone}
        </Typography>
      </Box>
      <Button
        variant="contained"
        sx={{ backgroundColor: '#4CAF50', color: '#fff' }}
        onClick={() => navigate('/consulta')}
      >
        Hacer Consulta
      </Button>
    </Box>
  );
};

export default VistaCliente;