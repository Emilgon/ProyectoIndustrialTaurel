import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useParams, useNavigate } from "react-router-dom";
import { db } from '../firebaseConfig';
import { query, where, getDocs, collection } from 'firebase/firestore';
import './VistaCliente.css';

const VistaCliente = () => {
  const [userData, setUserData] = useState({});
  const [respuestas, setRespuestas] = useState([]);
  const auth = getAuth();
  const navigate = useNavigate();
  const { consultaId } = useParams();

  // Función para cerrar sesión
  const handleSalir = () => {
    navigate('/login');
  };

  // Obtener datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userRef = collection(db, 'Clients'); // Verifica el nombre correcto de la colección
          const querySnapshot = await getDocs(userRef);
          querySnapshot.forEach((doc) => {
            if (doc.data().email.toLowerCase() === user.email.toLowerCase()) {
              setUserData({ ...doc.data(), uid: user.uid });
            }
          });
        }
      });
    };

    fetchUserData();
  }, []);

  return (
    <div className="container">
      <nav className="menu-lateral">
        <ul>
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
      </div>

      <div className="vista-cliente-container">
        <h2>Historial de Respuestas</h2>
        <div className="respuestas-historial">
          {respuestas.length > 0 ? (
            respuestas.map((respuesta) => (
              <div key={respuesta.id} className="respuesta-item">
                <p><strong>Respuesta:</strong> {respuesta.reply}</p>
                <p><small>
                  Enviado el: {respuesta.timestamp?.seconds
                    ? new Date(respuesta.timestamp.seconds * 1000).toLocaleString()
                    : "Sin fecha"}
                </small></p>
              </div>
            ))
          ) : (
            <p>No hay respuestas aún.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VistaCliente;
