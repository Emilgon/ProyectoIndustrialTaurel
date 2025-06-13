import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, collection, addDoc } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Card, IconButton } from '@mui/material';
import Swal from 'sweetalert2';
import { Phone as PhoneIcon, ArrowBack as ArrowBackIcon, Person as PersonIcon, Email as EmailIcon, Lock as LockIcon, Business as BusinessIcon, Work as WorkIcon, Home as HomeIcon } from '@mui/icons-material';
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
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  const validatePassword = (password) => {
    // Mínimo 8 caracteres
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    
    // Al menos una letra mayúscula
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una letra mayúscula';
    }
    
    // Al menos una letra minúscula
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe contener al menos una letra minúscula';
    }
    
    // Al menos un número
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe contener al menos un número';
    }
    
    // Al menos un carácter especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'La contraseña debe contener al menos un carácter especial';
    }
    
    return '';
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }

    let strength = 0;
    
    // Longitud
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Complejidad
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    // Determinar fuerza
    if (strength <= 3) {
      setPasswordStrength('Débil');
    } else if (strength <= 5) {
      setPasswordStrength('Moderada');
    } else {
      setPasswordStrength('Fuerte');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    setErrors(prevState => ({ ...prevState, [name]: '' })); // Limpiar el error al escribir
    
    // Validar contraseña en tiempo real
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'Débil': return 'error.main';
      case 'Moderada': return 'warning.main';
      case 'Fuerte': return 'success.main';
      default: return 'text.secondary';
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (formData.name.trim() === '') newErrors.name = 'El campo nombre no puede estar vacío.';
    if (formData.email.trim() === '') newErrors.email = 'El campo correo electrónico no puede estar vacío.';
    // Removed business email restriction to allow any email
    // else if (!isBusinessEmail(formData.email.trim())) newErrors.email = 'Por favor ingrese un correo electrónico empresarial.';
    if (formData.password.trim() === '') newErrors.password = 'El campo contraseña no puede estar vacío.';
    else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }
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
        phone: formData.phone, // Asegúrate de que sea una cadena
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
          <IconButton onClick={() => navigate('/menu')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            Registro de cliente
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
          <TextField
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            placeholder="+58 04XX-XXX-XXXX" // Placeholder con el formato deseado
            error={errors.phone !== ''}
            helperText={errors.phone}
            InputProps={{
              startAdornment: <PhoneIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
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
            helperText={errors.password || (
              <Typography variant="caption" color={getPasswordStrengthColor()}>
                {passwordStrength && `Seguridad: ${passwordStrength}`}
              </Typography>
            )}
            InputProps={{
              startAdornment: <LockIcon sx={{ color: '#1B5C94', mr: 1 }} />,
            }}
          />
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              La contraseña debe contener:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 0.5, mb: 0 }}>
              <Box component="li" sx={{ fontSize: '0.75rem', color: formData.password.length >= 8 ? 'success.main' : 'text.secondary' }}>
                Mínimo 8 caracteres
              </Box>
              <Box component="li" sx={{ fontSize: '0.75rem', color: /[A-Z]/.test(formData.password) ? 'success.main' : 'text.secondary' }}>
                Al menos una mayúscula
              </Box>
              <Box component="li" sx={{ fontSize: '0.75rem', color: /[a-z]/.test(formData.password) ? 'success.main' : 'text.secondary' }}>
                Al menos una minúscula
              </Box>
              <Box component="li" sx={{ fontSize: '0.75rem', color: /[0-9]/.test(formData.password) ? 'success.main' : 'text.secondary' }}>
                Al menos un número
              </Box>
              <Box component="li" sx={{ fontSize: '0.75rem', color: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'success.main' : 'text.secondary' }}>
                Al menos un carácter especial
              </Box>
            </Box>
          </Box>
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