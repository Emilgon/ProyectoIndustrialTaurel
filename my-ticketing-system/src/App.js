import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
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
import VistaClienteConsulta from "./VistaClienteconsulta/VistaClienteConsulta";

function Header() {
  const location = useLocation();
  const isVistaAsesorFormulario =
    location.pathname === "/vista-asesor-formulario";
  const isReportes = location.pathname === "/reportes";
  const isClientsInfo = location.pathname === "/clients-info";
  const isMenu = location.pathname === "/menu";
  const showAdminIcon =
    !isVistaAsesorFormulario && !isReportes && !isClientsInfo;

  // Tamaño aumentado para todos los íconos
  const iconStyle = {
    fontSize: "45px",
    color: "white",
  };

  // Función para manejar el clic en el logo
  const handleLogoClick = (e) => {
    e.preventDefault();
    window.open("https://taurel.com", "_blank");
  };

  return (
    <header className="App-header">
      <div className="header-wrapper">
        {/* Logo centrado con solución definitiva */}
        <div className="logo-center">
          <a 
            href="https://taurel.com" 
            onClick={handleLogoClick}
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Taurel Website"
            style={{
              display: "inline-block",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <img
              src="/images/taurel-logo-completo.png"
              alt="Logo Taurel"
              className="App-logo"
              style={{
                pointerEvents: "none",
              }}
            />
          </a>
        </div>

        {/* Íconos a la derecha con tooltips */}
        <div className="header-icons">
          {/* Ícono Home - Solo visible cuando NO estamos en /menu */}
          {!isMenu && (
            <div className="icon-tooltip">
              <Link to="/menu" className="icon-link" aria-label="Home">
                <svg width="45" height="45" viewBox="0 0 24 24" fill="white">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </Link>
              <span className="tooltip-text">Ir a menú principal</span>
            </div>
          )}

          {/* Íconos para /vista-asesor-formulario */}
          {isVistaAsesorFormulario && (
            <>
              <div className="icon-tooltip">
                <Link
                  to="/clients-info"
                  className="icon-link"
                  aria-label="Clientes"
                >
                  <PeopleIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Ver clientes</span>
              </div>

              <div className="icon-tooltip">
                <Link
                  to="/reportes"
                  className="icon-link"
                  aria-label="Reportes"
                >
                  <AssessmentIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Ver reportes</span>
              </div>

              <div className="icon-tooltip">
                <Link
                  to="/asesor-control"
                  className="icon-link"
                  aria-label="Control Asesor"
                >
                  <AccountTreeIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Panel de control</span>
              </div>
            </>
          )}

          {/* Íconos para /clients-info */}
          {isClientsInfo && (
            <>
              <div className="icon-tooltip">
                <Link
                  to="/vista-asesor-formulario"
                  className="icon-link"
                  aria-label="Consultas"
                >
                  <QuestionAnswerIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Volver a consultas</span>
              </div>

              <div className="icon-tooltip">
                <Link
                  to="/reportes"
                  className="icon-link"
                  aria-label="Reportes"
                >
                  <AssessmentIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Ver reportes</span>
              </div>

              <div className="icon-tooltip">
                <Link
                  to="/asesor-control"
                  className="icon-link"
                  aria-label="Control Asesor"
                >
                  <AccountTreeIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Panel de control</span>
              </div>
            </>
          )}

          {/* Íconos para /reportes */}
          {isReportes && (
            <>
              <div className="icon-tooltip">
                <Link
                  to="/vista-asesor-formulario"
                  className="icon-link"
                  aria-label="Consultas"
                >
                  <QuestionAnswerIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Volver a consultas</span>
              </div>

              <div className="icon-tooltip">
                <Link
                  to="/clients-info"
                  className="icon-link"
                  aria-label="Clientes"
                >
                  <PeopleIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Ver clientes</span>
              </div>

              <div className="icon-tooltip">
                <Link
                  to="/asesor-control"
                  className="icon-link"
                  aria-label="Control Asesor"
                >
                  <AccountTreeIcon style={iconStyle} />
                </Link>
                <span className="tooltip-text">Panel de control</span>
              </div>
            </>
          )}

          {/* Ícono Admin - Visible en todas las demás vistas */}
          {showAdminIcon && (
            <div className="icon-tooltip">
              <Link
                to="/login-asesor"
                className="icon-link"
                aria-label="Administrador"
              >
                <AdminPanelSettingsIcon style={iconStyle} />
              </Link>
              <span className="tooltip-text">Iniciar sesión como asesor</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Componente principal de la aplicación que configura el enrutamiento y la estructura general.
 * @returns {JSX.Element} El elemento JSX que representa la aplicación.
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/login" element={<LoginRegisterClient />} />
          <Route path="/formulario-cliente" element={<FormularioCliente />} />
          <Route path="/login-asesor" element={<LoginRegisterAdvisor />} />
          <Route path="/asesor-control" element={<AsesorControl />} />
          <Route
            path="/vista-asesor-formulario"
            element={<VistaAsesorFormulario />}
          />
          <Route path="/clients-info" element={<ClientsInfo />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/Respuestas/:consultaId" element={<Respuesta />} />
          <Route path="/vista-cliente" element={<VistaCliente />} />
          <Route
            path="/vista-cliente/:consultaId"
            element={<VistaClienteConsulta />}
          />
          <Route
            path="/vista-cliente-consulta"
            element={<VistaClienteConsulta />}
          />
          <Route path="/consulta" element={<Consulta />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;