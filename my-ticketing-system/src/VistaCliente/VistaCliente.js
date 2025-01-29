import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig'; // Asegúrate de que la ruta es correcta
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Respuesta from '../Respuesta/Respuesta'; // Importa el componente Respuesta

const VistaCliente = () => {
  const [userData, setUserData] = useState({});
  const [respuestas, setRespuestas] = useState([]);

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

    const fetchRespuestas = async () => {
      const user = auth.currentUser;
      if (user) {
        const respuestasRef = query(collection(db, 'Responses'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(respuestasRef);
        const respuestasArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRespuestas(respuestasArray);
      }
    };

    fetchUserData();
    fetchRespuestas();
  }, []);

  const handleSalir = () => {
    // Manejar la salida del usuario
  };

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
              <Respuesta key={respuesta.id} respuesta={respuesta} />
            ))
          ) : (
            <p>No hay respuestas disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VistaCliente;