import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import FormularioCliente from './FormularioCliente/FormularioCliente';
import VistaAsesorFormulario from './VistaAsesorFormulario/VistaAsesorFormulario';
import Reports from './Reportes/Reportes'; 
import { initializeFirestore } from './initializeFirestore';

function App() {
  useEffect(() => {
    initializeFirestore();
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Link to="/">
            <img src="/images/taurel-logo-completo.png" alt="Logo Taurel" className="App-logo" />
          </Link>
        </header>
        <Routes>
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
          <Route path="/" element={
            <>
              <FormularioCliente />
              <button className="asesor-button" onClick={() => window.location.href = '/asesor'}>
                SOY ASESOR
              </button>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
