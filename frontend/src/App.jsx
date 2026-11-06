import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaPrivada, SesionProvider } from './sesion/SesionContext.jsx';
import Login from './pages/Login.jsx';
import RecuperarClave from './pages/RecuperarClave.jsx';
import DefinirClave from './pages/DefinirClave.jsx';
import MisObras from './pages/MisObras.jsx';
import NuevaObra from './pages/NuevaObra.jsx';
import DetalleObra from './pages/DetalleObra.jsx';
import Participantes from './pages/Participantes.jsx';
import Relevamiento from './pages/Relevamiento.jsx';
import PresupuestoObra from './pages/PresupuestoObra.jsx';
import Movimientos from './pages/Movimientos.jsx';
import Comparacion from './pages/Comparacion.jsx';
import Alertas from './pages/Alertas.jsx';
import Estado from './pages/Estado.jsx';

export default function App() {
  return (
    <SesionProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-clave" element={<RecuperarClave />} />
        <Route path="/definir-clave" element={<DefinirClave />} />
        <Route path="/estado" element={<Estado />} />
        <Route path="/obras" element={<RutaPrivada><MisObras /></RutaPrivada>} />
        <Route path="/obras/nueva" element={<RutaPrivada><NuevaObra /></RutaPrivada>} />
        <Route path="/obras/:idObra" element={<RutaPrivada><DetalleObra /></RutaPrivada>} />
        <Route path="/obras/:idObra/participantes" element={<RutaPrivada><Participantes /></RutaPrivada>} />
        <Route path="/obras/:idObra/relevamiento" element={<RutaPrivada><Relevamiento /></RutaPrivada>} />
        <Route path="/obras/:idObra/presupuesto" element={<RutaPrivada><PresupuestoObra /></RutaPrivada>} />
        <Route path="/obras/:idObra/cobros" element={<RutaPrivada><Movimientos tipo="INGRESO" /></RutaPrivada>} />
        <Route path="/obras/:idObra/pagos" element={<RutaPrivada><Movimientos tipo="EGRESO" /></RutaPrivada>} />
        <Route path="/obras/:idObra/comparacion" element={<RutaPrivada><Comparacion /></RutaPrivada>} />
        <Route path="/obras/:idObra/alertas" element={<RutaPrivada><Alertas /></RutaPrivada>} />
        <Route path="*" element={<Navigate to="/obras" replace />} />
      </Routes>
    </SesionProvider>
  );
}
