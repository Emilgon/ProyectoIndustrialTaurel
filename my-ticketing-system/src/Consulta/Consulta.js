import React, { useState } from 'react';
import { db, collection, addDoc, auth, getDocs } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore'; // Importar serverTimestamp
import Swal from 'sweetalert2';
import { Box, Button, TextField, Typography } from '@mui/material';

const Consulta = () => {
    const auth = getAuth();
    const [mensaje, setMensaje] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleEnviarConsulta = async () => {
        try {
            const mensajeRef = await addDoc(collection(db, "Messages"), {
                content: mensaje,
            });
            const user = auth.currentUser;
            if (user) {
                const userRef = collection(db, 'Clients');
                const querySnapshot = await getDocs(userRef);
                const userData = querySnapshot.docs.find((doc) => doc.data().email === user.email);
                if (userData) {
                    const company = userData.data().company;
                    const name = userData.data().name;
                    await addDoc(collection(db, "Consults"), {
                        name: name,
                        company: company,
                        type: 'Tipo de consulta', // Reemplaza esto con el tipo de consulta
                        star_date: new Date(), // Puedes mantener este campo si lo necesitas
                        indicator: 30,
                        status: 'Pendiente',
                        email: user.email,
                        messageContent: mensaje,
                        attachment: archivo ? archivo.name : '',
                        timestamp: serverTimestamp(), // Guarda la fecha y hora exactas
                    });
                }
            }
            setMensaje("");
            setArchivo(null);
            setPreview(null);
            Swal.fire({
                icon: 'success',
                title: 'Consulta enviada',
                text: 'Tu consulta ha sido enviada con éxito',
            });
        } catch (error) {
            console.error("Error al enviar consulta:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al enviar consulta',
                text: 'Hubo un error al enviar tu consulta',
            });
        }
    };

    const handleArchivoChange = (e) => {
        const archivoSeleccionado = e.target.files[0];
        setArchivo(archivoSeleccionado);
        const archivoUrl = URL.createObjectURL(archivoSeleccionado);
        setPreview(archivoUrl);
    };

    return (
        <Box className="consulta-form">
            <TextField
                label="Mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                variant="outlined"
                multiline
                rows={4}
                sx={{ width: '100%' }}
            />
            <input
                type="file"
                onChange={handleArchivoChange}
            />
            {preview && (
                <img src={preview} alt="Archivo" />
            )}
            <Button
                variant="contained"
                onClick={handleEnviarConsulta}
            >
                Enviar consulta
            </Button>
        </Box>
    );
};

export default Consulta;