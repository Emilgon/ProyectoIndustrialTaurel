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

  // Función para cerrar sesión
  const handleSalir = () => {
    navigate('/login');
  };

  // Obtener datos del usuario
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
                setUserData({ ...doc.data(), uid: user.uid });  // Asegúrate de que el uid se agregue correctamente a userData
              }
            });
          });
        }
      });
    };
    fetchUserData();
  }, []);


  // Función para obtener las respuestas
  const obtenerConsultas = async (clienteId) => {
    console.log('Obteniendo consultas para el cliente:', clienteId);
    // Modificar la consulta para buscar respuestas basadas en el clienteId
    const respuestasRef = query(collection(db, 'Responses'), where('clienteId', '==', clienteId));
    const respuestasSnapshot = await getDocs(respuestasRef);
    return respuestasSnapshot.docs.map((doc) => doc.data());
  };

  // Mostrar historial de consultas
  const handleHistorial = async () => {
    if (!userData.uid) {
      console.log("El UID del usuario no está disponible.");
      return;
    }

    console.log('Cargando historial de consultas...');
    setMostrarHistorial(true);
    const respuestas = await obtenerConsultas(userData.uid); // Usar userData.uid para obtener respuestas del cliente autenticado
    setHistorialMensajes(respuestas);
    console.log('Respuestas cargadas:', respuestas);
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

        {/* Mostrar historial si está activado */}
        {mostrarHistorial && (
          <div className="historial-mensajes">
            <h3>Historial de Mensajes</h3>
            <ul>
              {historialMensajes.length > 0 ? (
                historialMensajes.map((consulta, index) => (
                  <li key={index}>
                    <p><strong>Respuesta:</strong> {consulta.reply}</p>
                    <p><strong>Fecha:</strong> {new Date(consulta.timestamp.seconds * 1000).toLocaleString()}</p>
                  </li>
                ))
              ) : (
                <p>No se encontraron respuestas.</p>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VistaCliente;
