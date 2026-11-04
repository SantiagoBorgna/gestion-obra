import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaPrivada, SesionProvider } from './sesion/SesionContext.jsx';
import Login from './pages/Login.jsx';
import RecuperarClave from './pages/RecuperarClave.jsx';
import DefinirClave from './pages/DefinirClave.jsx';
import MisObras from './pages/MisObras.jsx';
import NuevaObra from './pages/NuevaObra.jsx';
import DetalleObra from './pages/DetalleObra.jsx';
import Relevamiento from './pages/Relevamiento.jsx';
import PresupuestoObra from './pages/PresupuestoObra.jsx';
import CobrosYPagos from './pages/CobrosYPagos.jsx';
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
        <Route path="/obras/:idObra/relevamiento" element={<RutaPrivada><Relevamiento /></RutaPrivada>} />
        <Route path="/obras/:idObra/presupuesto" element={<RutaPrivada><PresupuestoObra /></RutaPrivada>} />
        <Route path="/obras/:idObra/pagos" element={<RutaPrivada><CobrosYPagos /></RutaPrivada>} />
        <Route path="*" element={<Navigate to="/obras" replace />} />
      </Routes>
    </SesionProvider>
  );
}
