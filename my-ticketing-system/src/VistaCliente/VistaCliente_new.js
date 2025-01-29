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
  const [loading, setLoading] = useState(true); // New loading state
  const [error, setError] = useState(null); // New error state
  const auth = getAuth();
  const navigate = useNavigate();

  // Función para cerrar sesión
  const handleSalir = () => {
    navigate('/login');
  };

  // Obtener datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true); // Set loading to true when fetching starts
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userId = user.uid;
            const userRef = collection(db, 'Clients');
            const querySnapshot = await getDocs(userRef); // Await the query
            querySnapshot.forEach((doc) => {
              if (doc.data().email === user.email) {
                setUserData({ ...doc.data(), uid: user.uid });
              }
            });
          }
        });
      } catch (err) {
        setError('Error fetching user data'); // Set error state
        console.error(err);
      } finally {
        setLoading(false); // Set loading to false when fetching is done
      }
    };
    fetchUserData();
  }, [auth]);

  // Función para obtener las respuestas
  const obtenerConsultas = async (name) => {
    const respuestasRef = query(collection(db, 'Consults'), where('name', '==', name));
    const respuestasSnapshot = await getDocs(respuestasRef);
    console.log(respuestasSnapshot)
    return respuestasSnapshot.docs.map((doc) => doc.data());
  };

  // Mostrar historial de consultas
  const handleHistorial = async () => {
    if (!userData.uid) {
      return;
    }

    console.log('Cargando historial de consultas...');
    setMostrarHistorial(true);
    const respuestas = await obtenerConsultas(userData.uid);
    setHistorialMensajes(respuestas);
    console.log('Respuestas cargadas:', respuestas);
  };

  if (loading) {
    return <div>Cargando datos del cliente...</div>; // Loading message
  }

  if (error) {
    return <div>{error}</div>; // Error message
  }

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
