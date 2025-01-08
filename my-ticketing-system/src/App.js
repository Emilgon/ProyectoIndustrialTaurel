import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import './App.css';
import FormularioCliente from './FormularioCliente/FormularioCliente';
import VistaAsesorFormulario from './VistaAsesorFormulario/VistaAsesorFormulario';
import Reports from './Reportes/Reportes';
import Respuestas from './Respuesta/Respuesta'; // Importa el componente de Respuestas
import { initializeFirestore } from './initializeFirestore';
import LoginRegisterClient from './LoginRegisterClient/LoginRegisterClient';
import VistaCliente from './VistaCliente/VistaCliente';
import Consulta from './Consulta/Consulta';
import Menu from './Menu/Menu';
import LoginRegisterAdvisor from './LoginRegisterAdvisor/LoginRegisterAdvisor';
import '@fortawesome/fontawesome-free/css/all.min.css';

function App() {
  useEffect(() => {
    initializeFirestore();
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Link to="/menu">
            <img src="/images/taurel-logo-completo.png" alt="Logo Taurel" className="App-logo" />
          </Link>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />

          <Route path="/asesor" element={
            <>
              <VistaAsesorFormulario />
              <footer className="App-footer">
                <Link to="/asesor" className="footer-link">VISTA ASESOR</Link>
                <Link to="/reportes" className="footer-link">REPORTES</Link>
              </footer>
            </>
          } />
          <Route path="/reportes" element={
            <>
              <Reports />
              <footer className="App-footer">
                <Link to="/asesor" className="footer-link">VISTA ASESOR</Link>
                <Link to="/reportes" className="footer-link">REPORTES</Link>
              </footer>
            </>
          } />
          {/* Nueva ruta para manejar las respuestas específicas de las consultas */}
          <Route path="/Respuestas/:consultaId" element={<Respuestas />} />
          <Route path="/login" element={<LoginRegisterClient />} />
          <Route path="/formulario-cliente" element={<FormularioCliente />} />
          <Route path="/vista-cliente" element={<VistaCliente />} />
          <Route path="/consulta" element={<Consulta />} />
          <Route path="/login-asesor" element={<LoginRegisterAdvisor />} />
          <Route path="/menu" element={<Menu />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;