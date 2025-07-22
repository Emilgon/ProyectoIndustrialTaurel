import { getDocs, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Actualiza el campo 'correo' en todos los documentos de la colección 'consults'
 * en Firestore si el campo no existe.
 * Este script parece ser de un solo uso para migración de datos.
 * @async
 */
const updateEmailField = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'consults'));
    querySnapshot.forEach(async (docSnapshot) => {
      const data = docSnapshot.data();
      if (!data.correo) {
        await updateDoc(doc(db, 'consults', docSnapshot.id), { correo: 'correo@ejemplo.com' });
      }
    });
    console.log('Campo de correo actualizado correctamente.');
  } catch (error) {
    console.error('Error al actualizar el campo de correo: ', error);
  }
};

updateEmailField();
