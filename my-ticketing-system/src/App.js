import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from "react-router-dom";
import "./App.css";
import Menu from "./Menu/Menu";
import LoginRegisterClient from "./LoginRegisterClient/LoginRegisterClient";
import LoginRegisterAdvisor from "./LoginRegisterAdvisor/LoginRegisterAdvisor";
import AsesorControl from "./AsesorControl";
import VistaAsesorFormulario from "./VistaAsesorFormulario/VistaAsesorFormulario";
import ClientsInfo from "./ClientsInfo/ClientsInfo";
import Reportes from "./Reportes/Reportes";
import Respuesta from "./Respuesta/Respuesta";
import VistaCliente from "./VistaCliente/VistaCliente";
import Consulta from "./Consulta/Consulta";
import FormularioCliente from "./FormularioCliente/FormularioCliente";

function App() {
  return (
    <Router>
      <div className="App">
        {/* Header que muestra "Consultas" en /menu y solo logo en otras páginas */}
        <header className="App-header">
          <Link to="/menu" className="logo-container">
            <img src="/images/taurel-logo-completo.png" alt="Logo Taurel" className="App-logo" />
          </Link>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/login" element={<LoginRegisterClient />} />
          <Route path="/formulario-cliente" element={<FormularioCliente />} />
          <Route path="/login-asesor" element={<LoginRegisterAdvisor />} />
          <Route path="/asesor-control" element={<AsesorControl />} />
          <Route path="/vista-asesor-formulario" element={<VistaAsesorFormulario />} />
          <Route path="/clients-info" element={<ClientsInfo />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/Respuestas/:consultaId" element={<Respuesta />} />
          <Route path="/vista-cliente" element={<VistaCliente />} />
          <Route path="/consulta" element={<Consulta />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;