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
  const auth = getAuth();
  const handleSalir = () => {
    navigate('/login');
  };
  const navigate = useNavigate();
  const [historialMensajes, setHistorialMensajes] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

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

  const obtenerConsultas = async () => {
    console.log('La función obtenerConsultas está siendo llamada');
    const consultasRef = query(collection(db, 'Consults'), where('clienteId', '==', 'id-del-cliente'));
    const consultas = await getDocs(consultasRef);
    console.log('La consulta a la base de datos ha sido realizada con éxito');
    const consultasData = consultas.docs.map((doc) => doc.data());
    console.log('Los datos han sido obtenidos correctamente:', consultasData);
    return consultasData;
  };

  const handleHistorial = async () => {
    console.log('La función handleHistorial está siendo llamada');
    setMostrarHistorial(true);
    const respuestas = await obtenerConsultas();
    setHistorialMensajes(respuestas);
    console.log('El estado historialMensajes ha sido actualizado:', historialMensajes);
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
              {historialMensajes.map((consulta, index) => (
                <li key={index}>
                  <p>Respuesta: {consulta.reply}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VistaCliente;
