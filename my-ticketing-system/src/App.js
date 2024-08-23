import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import FormularioCliente from './FormularioCliente/FormularioCliente';
import VistaAsesorFormulario from './VistaAsesorFormulario/VistaAsesorFormulario';
import { initializeFirestore } from './initializeFirestore';

function App() {
  useEffect(() => {
    initializeFirestore();
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src="/images/taurel-logo-completo.png" alt="Logo Taurel" className="App-logo" />
        </header>
        <Routes>
          <Route path="/asesor" element={<VistaAsesorFormulario />} />
          <Route 
            path="/" 
            element={
              <>
                <FormularioCliente />
                <button className="asesor-button" onClick={() => window.location.href = '/asesor'}>
                  Soy Asesor
                </button>
              </>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
