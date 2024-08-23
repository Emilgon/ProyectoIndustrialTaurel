import { getDocs, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const updateEmailField = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'Consultas'));
    querySnapshot.forEach(async (docSnapshot) => {
      const data = docSnapshot.data();
      if (!data.correo) {
        await updateDoc(doc(db, 'Consultas', docSnapshot.id), { correo: 'correo@ejemplo.com' });
      }
    });
    console.log('Campo de correo actualizado correctamente.');
  } catch (error) {
    console.error('Error al actualizar el campo de correo: ', error);
  }
};

updateEmailField();
