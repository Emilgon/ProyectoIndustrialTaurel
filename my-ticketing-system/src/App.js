import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from "react-router-dom";
import "./App.css";
import Menu from "./Menu/Menu";
import LoginRegisterClient from "./LoginRegisterClient/LoginRegisterClient";
import LoginRegisterAdvisor from "./LoginRegisterAdvisor/LoginRegisterAdvisor";
import AsesorControl from "./AsesorControl"; // Ruta para el panel de asesor
import VistaAsesorFormulario from "./VistaAsesorFormulario/VistaAsesorFormulario"; // Ruta para consultas
import ClientsInfo from "./ClientsInfo/ClientsInfo"; // Ruta para clientes
import Reportes from "./Reportes/Reportes"; // Ruta para reportes

function App() {
  return (
    <Router>
      <div className="App">
        {/* Header con el logo de Taurel */}
        <header className="App-header">
          <Link to="/menu">
            <img src="/images/taurel-logo-completo.png" alt="Logo Taurel" className="App-logo" />
          </Link>
        </header>

        {/* Rutas de la aplicación */}
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/login" element={<LoginRegisterClient />} />
          <Route path="/login-asesor" element={<LoginRegisterAdvisor />} />
          <Route path="/asesor-control" element={<AsesorControl />} />
          <Route path="/vista-asesor-formulario" element={<VistaAsesorFormulario />} />
          <Route path="/clients-info" element={<ClientsInfo />} />
          <Route path="/reportes" element={<Reportes />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;