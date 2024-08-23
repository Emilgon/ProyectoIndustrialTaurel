import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import Swal from 'sweetalert2';
import { db, collection, addDoc } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './FormularioCliente.css';

const FormularioCliente = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        telefono: '',
        correo: '',
        empresa: '',
        mensaje: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);

    const navigate = useNavigate();

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
        const emptyFields = Object.values(formData).some(value => value.trim() === '');
        if (emptyFields) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, completa todos los campos antes de enviar.',
            });
            return;
        }

        try {
            await addDoc(collection(db, 'Consultas'), {
                ...formData,
                adjuntado: selectedFiles.map(file => file.name).join(', '),
                fecha_solicitud: new Date(),
                estado: 'Pendiente',
                respuesta: null
            });

            Swal.fire({
                icon: 'success',
                title: 'Consulta Enviada',
                text: 'Tu consulta ha sido enviada exitosamente.',
            });

            setFormData({
                nombre: '',
                apellido: '',
                telefono: '',
                correo: '',
                empresa: '',
                mensaje: ''
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
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                    <TextField
                        label="Apellido"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                </Box>
                <Box display="flex" gap={2}>
                    <TextField
                        label="Teléfono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                    <TextField
                        label="Correo"
                        name="correo"
                        value={formData.correo}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                </Box>
                <TextField
                    label="Empresa/Compañía"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                />
                <TextField
                    label="Mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                />
                <Box display="flex" gap={2} alignItems="center">
                    <Button
                        variant="contained"
                        component="label"
                        className="attach-button"
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
                    >
                        Enviar Consulta
                    </Button>
                </Box>
                {selectedFiles.length > 0 && (
                    <Box className="file-preview">
                        {selectedFiles.map(file => (
                            <Box key={file.name} display="flex" justifyContent="space-between" alignItems="center">
                                <span>{file.name}</span>
                                <Button
                                    variant="text"
                                    color="secondary"
                                    onClick={() => handleDeleteFile(file.name)}
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
