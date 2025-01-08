import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, collection, addDoc, getDocs, updateDoc, onSnapshot } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography } from '@mui/material';
import './LoginRegisterAdvisor.css';
import Swal from 'sweetalert2';

const LoginRegisterAdvisor = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [nameError, setNameError] = useState('');

    const navigate = useNavigate();

    const auth = getAuth();

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Asesor logueado con éxito:', userCredential.user);
            navigate('/asesor'); // Redirige al asesor a la página de inicio
        } catch (error) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                setEmailError('El correo electrónico no está registrado o la contraseña es incorrecta.');
            } else {
                console.error('Error al iniciar sesión:', error);
            }
        }
    };

    const handleRegister = async () => {
        setShowForm(true);
    };

    // Función para crear un nuevo asesor
    const handleCreateUser = async () => {
        if (name.trim() === '') {
            setNameError('El campo nombre no puede estar vacío.');
            return;
        }
        if (email.trim() === '') {
            setEmailError('El campo correo electrónico no puede estar vacío.');
            return;
        }
        if (password.trim() === '') {
            setEmailError('El campo contraseña no puede estar vacío.');
            return;
        }

        try {
            // Crear el usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Asesor registrado con éxito:', userCredential.user);

            // Obtener el número de consultas en Firestore
            const consultasRef = collection(db, 'Consults');
            const consultasSnapshot = await getDocs(consultasRef);
            const numConsultas = consultasSnapshot.docs.length;

            // Agregar el asesor a Firestore con el número de consultas
            const advisorRef = await addDoc(collection(db, 'Advisors'), {
                name: name,
                email: email,
                request: numConsultas, // Asignar el número de consultas al atributo request
            });

            // Actualizar el atributo request del asesor cada vez que se agrega una nueva consulta
            onSnapshot(consultasRef, (snapshot) => {
                const newNumConsultas = snapshot.docs.length;
                updateDoc(advisorRef, { request: newNumConsultas });
            });

            // Mostrar mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: 'Asesor registrado con éxito',
                text: 'Bienvenido a nuestra plataforma',
            });

            // Redirigir al asesor a la página de inicio
            navigate('/asesor');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setEmailError('El correo electrónico ya está en uso.');
            } else {
                console.error('Error al registrar asesor:', error);
            }
        }
    };

    if (showForm) {
        return (
            <Box className="login-container">
                <Button variant="text" onClick={() => setShowForm(false)}>
                    <i className="fas fa-arrow-left"></i> Volver
                </Button>
                <Box className="login-box">
                    <Typography variant="h4" component="h1">
                        Registro de Asesor
                    </Typography>
                    <Box className="login-form">
                        <TextField
                            label="Nombre"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setNameError('');
                            }}
                            fullWidth
                            margin="normal"
                            error={nameError !== ''}
                            helperText={nameError}
                        />
                        <TextField
                            label="Correo electrónico"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError('');
                            }}
                            fullWidth
                            margin="normal"
                            error={emailError !== ''}
                            helperText={emailError}
                        />
                        <TextField
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Button variant="contained" onClick={handleCreateUser}>
                            Registrarme
                        </Button>
                    </Box>
                </Box>
            </Box>
        );
    } else {
        return (
            <Box className="login-container">
                <Button variant="text" onClick={() => navigate('/menu')}>
                    <i className="fas fa-arrow-left"></i> Volver
                </Button>
                <Box className="login-box">
                    <Typography variant="h4" component="h1">
                        Login
                    </Typography>
                    <Box className="login-form">
                        <TextField
                            label="Correo electrónico"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            margin="normal"
                            error={emailError !== ''}
                            helperText={emailError}
                        />
                        <TextField
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Button variant="contained" onClick={handleLogin}>
                            Login
                        </Button>
                        <Button variant="text" onClick={handleRegister}>
                            ¿No tienes cuenta? Regístrate
                        </Button>
                    </Box>
                </Box>
            </Box>
        );
    }
};

export default LoginRegisterAdvisor;