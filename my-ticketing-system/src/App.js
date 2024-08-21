import React, { useEffect } from 'react';
import './App.css';
import FormularioCliente from './FormularioCliente/FormularioCliente';
import VistaAsesorFormulario from './VistaAsesorFormulario/VistaAsesorFormulario';
import Respuesta from './Respuesta/Respuesta';
import Reportes from './Reportes/Reportes';
import { initializeFirestore } from './initializeFirestore';

function App() {
  useEffect(() => {
    initializeFirestore();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src="/images/taurel-logo-completo.png" alt="Logo Taurel" className="header-logo" />
      </header>
      <FormularioCliente />
      
    </div>
  );
}

export default App;
