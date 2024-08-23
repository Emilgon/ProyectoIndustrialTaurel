import { db, collection, addDoc, setDoc, doc } from './firebaseConfig';

// Función para inicializar datos en Firestore
const initializeFirestore = async () => {
  try {
    // Agregar Cliente de Ejemplo
    await addDoc(collection(db, 'Clientes'), {
      nombre: "Juan",
      apellido: "Pérez",
      telefono: "123456789",
      correo: "juan.perez@example.com",
      empresa: "Empresa S.A.",
      mensaje: "Consulta sobre el producto X.",
      adjuntado: null // Aquí puedes añadir el enlace al archivo si es necesario
    });
    console.log('Cliente de ejemplo agregado con éxito!');

    // Agregar Asesor
    await setDoc(doc(db, 'Asesor', 'yurimia'), {
      nombre: "Yurimia",
      correo: "yurimia@taurel.com"
    });
    console.log('Asesor agregado con éxito!');

    // Agregar Tipos de Consultas
    await setDoc(doc(db, 'Tipos de Consultas', 'Asesoría técnica'), {
      tipo: 'Asesoría técnica'
    });
    await setDoc(doc(db, 'Tipos de Consultas', 'Clasificación arancelaria'), {
      tipo: 'Clasificación arancelaria'
    });
    console.log('Tipos de consultas agregados con éxito!');

    // Agregar Consulta de Ejemplo
    await addDoc(collection(db, 'Consultas'), {
      cliente_id: 'cliente1', // Debe ser el ID del cliente
      asesor_id: 'yurimia', // ID del asesor
      tipo: 'Asesoría técnica',
      fecha_solicitud: new Date(), // Fecha y hora actual
      fecha_cierre: null,
      estado: 'Pendiente',
      respuesta: null
    });
    console.log('Consulta de ejemplo agregada con éxito!');
  } catch (error) {
    console.error('Error al inicializar Firestore: ', error);
  }
};

export { initializeFirestore };
