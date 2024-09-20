import React, { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';
import Swal from 'sweetalert2';
import { db, collection, addDoc, doc, getDoc } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './FormularioCliente.css';

const FormularioCliente = () => {
    const [formData, setFormData] = useState({
        company: '',
        company_role: '',
        email: '',
        given_name: '',
        last_name: '',
        message: '',
        phone_number: '',
        request: 0
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const navigate = useNavigate();

    // Obtener los datos del cliente desde Firebase
    useEffect(() => {
        const fetchClientData = async () => {
            try {
                const docRef = doc(db, 'Clientes', 'ID_DEL_CLIENTE'); // Usa el ID adecuado
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.log("Error fetching client data:", error);
            }
        };

        fetchClientData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFileChange = (e) => {
        setSelectedFiles([...e.target.files]);
    };

    const handleDeleteFile = (fileName) => {
        setSelectedFiles(selectedFiles.filter(file => file.name !== fileName));
    };

    const handleSubmit = async () => {
        const emptyFields = Object.values(formData).some(value => {
            // Verifica si el valor es una cadena antes de aplicar trim
            return typeof value === 'string' && value.trim() === '';
        });

        if (emptyFields) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, completa todos los campos antes de enviar.',
            });
            return;
        }

        try {
            // Guarda la consulta en la colección 'Consultas'
            await addDoc(collection(db, 'Consultas'), {
                ...formData,
                attachment: selectedFiles.map(file => file.given_name).join(', '),
                apply_date: new Date(),
                status: 'Pendiente',
                reply: ''
            });

            // Guarda al cliente en la colección 'Clientes'
            await addDoc(collection(db, 'Clientes'), {
                company: formData.company,
                company_role: formData.company_role,
                email: formData.email,
                given_name: formData.given_name,
                last_name: formData.last_name,
                message: formData.message,
                phone_number: formData.phone_number,
                request: formData.request
            });

            Swal.fire({
                icon: 'success',
                title: 'Consulta Enviada',
                text: 'Tu consulta ha sido enviada exitosamente y el cliente ha sido registrado.',
            });

            // Restablecer el formulario
            setFormData({
                company: '',
                company_role: '',
                email: '',
                given_name: '',
                last_name: '',
                message: '',
                phone_number: '',
                request: 0
            });
            setSelectedFiles([]);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al enviar la consulta. Por favor, inténtalo de nuevo.',
            });
        }
    };

    return (
        <Box className="form-box">
            <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={2}>
                    <TextField
                        label="Nombre"
                        name="given_name"
                        value={formData.given_name}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                    <TextField
                        label="Apellido"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                </Box>
                <Box display="flex" gap={2}>
                    <TextField
                        label="Teléfono"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                    <TextField
                        label="Correo"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                </Box>
                <TextField
                    label="Empresa/Compañía"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                />
                <TextField
                    label="Rol en la compañía"
                    name="company_role"
                    value={formData.company_role}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                />
                <TextField
                    label="Mensaje"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={10}
                />
                <Box display="flex" gap={2} alignItems="center">
                    <Button
                        variant="contained"
                        component="label"
                        className="attach-button"
                        sx={{
                            backgroundColor: "#1B5C94",
                            color: "white",
                            borderRadius: "70px",
                            "&:hover": {
                                backgroundColor: "#145a8c",
                            },
                        }}
                    >
                        Adjuntar Archivos
                        <input
                            type="file"
                            hidden
                            multiple
                            onChange={handleFileChange}
                        />
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        sx={{
                            backgroundColor: "#1B5C94",
                            color: "white",
                            borderRadius: "70px",
                            "&:hover": {
                                backgroundColor: "#145a8c",
                            },
                        }}
                    >
                        Enviar Consulta
                    </Button>
                </Box>
                {selectedFiles.length > 0 && (
                    <Box className="file-preview">
                        {selectedFiles.map(file => (
                            <Box key={file.given_name} display="flex" justifyContent="space-between" alignItems="center">
                                <span>{file.given_name}</span>
                                <Button
                                    variant="text"
                                    color="secondary"
                                    onClick={() => handleDeleteFile(file.given_name)}
                                >
                                    Eliminar
                                </Button>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default FormularioCliente;
