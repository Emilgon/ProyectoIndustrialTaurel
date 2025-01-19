import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { query, where, getDocs, collection } from 'firebase/firestore';

import { Box, Typography, Button, ListItem, Drawer, List, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';
import './VistaCliente.css';

const VistaCliente = () => {
  const [userData, setUserData] = useState({});
  const [historialMensajes, setHistorialMensajes] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  const handleSalir = () => {
    navigate('/login');
  };

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

  const obtenerConsultas = async (clienteId) => {
    if (!clienteId) {
      console.error("El clienteId es inválido o no está disponible.");
      return [];
    }
    const consultasRef = query(collection(db, 'Consults'), where('clienteId', '==', clienteId));
    const consultas = await getDocs(consultasRef);
    const consultasData = consultas.docs.map((doc) => doc.data());
    return consultasData;
  };

  const handleHistorial = async () => {
    setMostrarHistorial(true);
    if (userData && userData.uid) {
      const respuestas = await obtenerConsultas(userData.uid);
      setHistorialMensajes(respuestas);
    } else {
      console.error('No se ha encontrado el UID del cliente.');
    }
  };

  return (
    <div className="container">
      <nav className="menu-lateral">
        <ul>
          <li>
            <a onClick={handleHistorial}>Historial</a>
          </li>
          <li>
            <a onClick={handleSalir}>Salir</a>
          </li>
        </ul>
      </nav>
      <div className="content">
        <h2>Datos del Cliente</h2>
        <p>Nombre: {userData.name}</p>
        <p>Dirección: {userData.address}</p>
        <p>Empresa: {userData.company}</p>
        <p>Rol en la empresa: {userData.company_role}</p>
        <p>Correo electrónico: {userData.email}</p>
        <p>Teléfono: {userData.phone}</p>

        {mostrarHistorial && (
          <div className="historial-mensajes">
            <h3>Historial de Mensajes</h3>
            <ul>
              {historialMensajes.length > 0 ? (
                historialMensajes.map((consulta, index) => (
                  <li key={index}>
                    <p><strong>Respuesta:</strong> {consulta.reply}</p>
                  </li>
                ))
              ) : (
                <p>No hay respuestas disponibles para mostrar.</p>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VistaCliente;
