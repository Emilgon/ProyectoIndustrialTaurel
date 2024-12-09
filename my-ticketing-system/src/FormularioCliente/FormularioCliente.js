import React, { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';
import Swal from 'sweetalert2';
import { db, collection, addDoc, doc, getDoc } from '../firebaseConfig';
import './FormularioCliente.css';

const FormularioCliente = () => {
    const [formData, setFormData] = useState({
        address: '',          // Campo para la dirección
        company: '',          // Campo para la compañía
        company_role: '',     // Campo para el rol en la compañía
        email: '',            // Campo para el email
        name: '',             // Nombre completo del cliente
        phone: '',            // Número de teléfono
        messageContent: '',   // Contenido del mensaje
        message: null,        // ID del mensaje en la colección Messages
        request: 0            // Número de solicitud (ajusta el tipo si es necesario)
    });
    const [selectedFiles, setSelectedFiles] = useState([]);

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
            // 1. Primero creamos el mensaje en la colección 'Messages'
            const messageRef = await addDoc(collection(db, 'Messages'), {
                content: formData.messageContent // Aquí se guarda el contenido del mensaje
            });

            // 2. Guarda la consulta en la colección 'Consultas'
            await addDoc(collection(db, 'Consults'), {
                ...formData,
                attachment: selectedFiles.map(file => file.name).join(', '),
                star_date: new Date(),
                status: 'Pendiente',
                reply: ''
            });

            // 3. Guarda el cliente en la colección 'Clients'
            await addDoc(collection(db, 'Clients'), {
                address: formData.address,          
                company: formData.company,          
                company_role: formData.company_role, 
                email: formData.email,              
                name: formData.name,                
                phone: formData.phone,              
                message: messageRef.id,             // Aquí se guarda el ID del mensaje
                request: formData.request            // Número de solicitud
            });

            Swal.fire({
                icon: 'success',
                title: 'Consulta Enviada',
                text: 'Tu consulta ha sido enviada exitosamente y el cliente ha sido registrado.',
            });

            // Restablecer el formulario
            setFormData({
                address: '',          
                company: '',          
                company_role: '',     
                email: '',            
                name: '',             
                phone: '',            
                messageContent: '',   // Reiniciar contenido del mensaje
                message: null,
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
                        label="Nombre y apellido"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        variant="outlined"
                        fullWidth
                    />
                </Box>
                <Box display="flex" gap={2}>
                    <TextField
                        label="Teléfono"
                        name="phone"  // Cambiar 'number' a 'phone'
                        value={formData.phone}
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
                    label="Dirección"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    variant="outlined"
                    fullWidth
                />
                <TextField
                    label="Mensaje"
                    name="messageContent"  // Cambiar 'message' a 'messageContent'
                    value={formData.messageContent}
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
                      <Box key={file.name} display="flex" justifyContent="space-between" alignItems="center">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt={file.name} style={{ maxWidth: "200px", maxHeight: "150px", marginRight: '8px' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <i className="fas fa-file" style={{ marginRight: '8px' }}></i>
                            <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer">{file.name}</a>
                          </div>
                        )}
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
