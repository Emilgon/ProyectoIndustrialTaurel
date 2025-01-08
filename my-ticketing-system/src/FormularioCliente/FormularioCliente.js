import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, collection, addDoc } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField } from '@mui/material';
import Swal from 'sweetalert2';
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
  const [addressError, setAddressError] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [companyRoleError, setCompanyRoleError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const auth = getAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async () => {
    if (formData.name.trim() === '') {
      setNameError('El campo nombre no puede estar vacío.');
      return;
    }
    if (formData.email.trim() === '') {
      setEmailError('El campo correo electrónico no puede estar vacío.');
      return;
    }
    if (formData.password.trim() === '') {
      setPasswordError('El campo contraseña no puede estar vacío.');
      return;
    }
    if (formData.phone.trim() === '') {
      setPhoneError('El campo teléfono no puede estar vacío.');
      return;
    }
    if (formData.address.trim() === '') {
      setAddressError('El campo dirección no puede estar vacío.');
      return;
    }
    if (formData.company.trim() === '') {
      setCompanyError('El campo empresa/compañía no puede estar vacío.');
      return;
    }
    if (formData.company_role.trim() === '') {
      setCompanyRoleError('El campo rol en la compañía no puede estar vacío.');
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
        phone: formData.phone,
      });
      Swal.fire({
        icon: 'success',
        title: 'Usuario registrado con éxito',
        text: 'Bienvenido a nuestra plataforma',
      });
      navigate('/vista-cliente');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setEmailError('El correo electrónico ya está en uso.');
      } else {
        console.error('Error al registrar usuario:', error);
      }
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
            error={nameError !== ''}
            helperText={nameError}
          />
        </Box>
        <Box display="flex" gap={2}>
          <TextField
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            error={phoneError !== ''}
            helperText={phoneError}
          />
          <TextField
            label="Correo electrónico"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            error={emailError !== ''}
            helperText={emailError}
          />
        </Box>
        <TextField
          label="Empresa/Compañía"
          name="company"
          value={formData.company}
          onChange={handleInputChange}
          variant="outlined"
          fullWidth
          error={companyError !== ''}
          helperText={companyError}
        />
        <TextField
          label="Rol en la compañía"
          name="company_role"
          value={formData.company_role}
          onChange={handleInputChange}
          variant="outlined"
          fullWidth
          error={companyRoleError !== ''}
          helperText={companyRoleError}
        />
        <TextField
          label="Dirección"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          variant="outlined"
          fullWidth
          error={addressError !== ''}
          helperText={addressError}
        />
        <TextField
          label="Contraseña"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          variant="outlined"
          fullWidth
          type="password"
          error={passwordError !== ''}
          helperText={passwordError}
        />
        <Button variant="contained" onClick={handleSubmit}>
          Registrarse
        </Button>
      </Box>
    </Box>
  );
};

export default FormularioCliente;