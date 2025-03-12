import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, collection, addDoc } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Card, IconButton } from '@mui/material';
import Swal from 'sweetalert2';
import { ArrowBack as ArrowBackIcon, Person as PersonIcon, Email as EmailIcon, Lock as LockIcon, Business as BusinessIcon, Work as WorkIcon, Home as HomeIcon } from '@mui/icons-material';
import MuiPhoneInput from 'mui-phone-input'; // Importar el componente de teléfono
import './FormularioCliente.css';

const FormularioCliente = () => {
  const [formData, setFormData] = useState({
    address: '',          // Campo para la dirección
    company: '',          // Campo para la compañía
    company_role: '',     // Campo para el rol en la compañía
    email: '',            // Campo para el email
    name: '',             // Nombre completo del cliente
    phone: '',            // Número de teléfono
    password: '',         // Contraseña del cliente
  });
  const [errors, setErrors] = useState({
    address: '',
    company: '',
    company_role: '',
    email: '',
    name: '',
    phone: '',
    password: '',
  });
  const navigate = useNavigate();
  const auth = getAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    setErrors(prevState => ({ ...prevState, [name]: '' })); // Limpiar el error al escribir
  };

  const handlePhoneChange = (value) => {
    setFormData(prevState => ({ ...prevState, phone: String(value) })); // Convertir a cadena
    setErrors(prevState => ({ ...prevState, phone: '' })); // Limpiar el error del teléfono
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (formData.name.trim() === '') newErrors.name = 'El campo nombre no puede estar vacío.';
    if (formData.email.trim() === '') newErrors.email = 'El campo correo electrónico no puede estar vacío.';
    if (formData.password.trim() === '') newErrors.password = 'El campo contraseña no puede estar vacío.';
    if (String(formData.phone).trim() === '') newErrors.phone = 'El campo teléfono no puede estar vacío.'; // Convertir a cadena antes de usar trim
    if (formData.address.trim() === '') newErrors.address = 'El campo dirección no puede estar vacío.';
    if (formData.company.trim() === '') newErrors.company = 'El campo empresa/compañía no puede estar vacío.';
    if (formData.company_role.trim() === '') newErrors.company_role = 'El campo rol en la compañía no puede estar vacío.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('Usuario registrado con éxito:', userCredential.user);
      await addDoc(collection(db, 'Clients'), {
        address: formData.address,
        company: formData.company,
        company_role: formData.company_role,
        email: formData.email,
        name: formData.name,
        phone: String(formData.phone), // Convertir a cadena antes de guardar
      });
      Swal.fire({
        icon: 'success',
        title: 'Usuario registrado con éxito',
        text: 'Bienvenido a nuestra plataforma',
      });
      navigate('/vista-cliente');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ ...errors, email: 'El correo electrónico ya está en uso.' });
      } else {
        console.error('Error al registrar usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al registrar. El correo electrónico ya está en uso.',
        });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2, width: '100%', maxWidth: 600 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/login')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            Registro de Cliente
          </Typography>
          <Box sx={{ width: 40 }} /> {/* Espacio para alinear el título */}
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Nombre y apellido"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            error={errors.name !== ''}
            helperText={errors.name}
            InputProps={{
              startAdornment: <PersonIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
          <MuiPhoneInput
            defaultCountry="ve" // País por defecto (Venezuela)
            label="Teléfono"
            value={formData.phone}
            onChange={handlePhoneChange}
            variant="outlined"
            fullWidth
            error={errors.phone !== ''}
            helperText={errors.phone}
          />
          <TextField
            label="Correo electrónico"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            error={errors.email !== ''}
            helperText={errors.email}
            InputProps={{
              startAdornment: <EmailIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
          <TextField
            label="Empresa/Compañía"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            error={errors.company !== ''}
            helperText={errors.company}
            InputProps={{
              startAdornment: <BusinessIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
          <TextField
            label="Rol en la compañía"
            name="company_role"
            value={formData.company_role}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            error={errors.company_role !== ''}
            helperText={errors.company_role}
            InputProps={{
              startAdornment: <WorkIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
          <TextField
            label="Dirección"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            error={errors.address !== ''}
            helperText={errors.address}
            InputProps={{
              startAdornment: <HomeIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
          <TextField
            label="Contraseña"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            type="password"
            error={errors.password !== ''}
            helperText={errors.password}
            InputProps={{
              startAdornment: <LockIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            sx={{
              backgroundColor: '#1B5C94',
              color: 'white',
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: '#145a8c',
              },
            }}
          >
            Registrarse
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default FormularioCliente;