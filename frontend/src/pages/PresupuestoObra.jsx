import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import VistaArquitecto from '../componentes/presupuesto/VistaArquitecto.jsx';
import VistaCliente from '../componentes/presupuesto/VistaCliente.jsx';
import VistaColaborador from '../componentes/presupuesto/VistaColaborador.jsx';
import { api } from '../api.js';
import { useSesion } from '../sesion/SesionContext.jsx';

// La misma pantalla muestra algo distinto según el perfil del usuario en la obra.
export default function PresupuestoObra() {
  const { idObra } = useParams();
  const { usuario } = useSesion();
  const [obra, setObra] = useState(null);
  const [presupuesto, setPresupuesto] = useState(undefined);
  const [tareas, setTareas] = useState([]);
  const [error, setError] = useState('');

  const esCliente = usuario.rol === 'CLIENTE';

  const cargarTareas = useCallback(() => (
    esCliente ? Promise.resolve([]) : api(`/obras/${idObra}/tareas`)
  ), [idObra, esCliente]);

  const recargar = useCallback(async () => {
    const [datosPresupuesto, datosTareas] = await Promise.all([api(`/obras/${idObra}/presupuesto`), cargarTareas()]);
    setPresupuesto(datosPresupuesto);
    setTareas(datosTareas);
  }, [idObra, cargarTareas]);

  useEffect(() => {
    Promise.all([api(`/obras/${idObra}`).then(setObra), recargar()]).catch((e) => setError(e.message));
  }, [idObra, recargar]);

  if (obra?.esArquitecto && presupuesto === null) {
    return <Navigate to={`/obras/${idObra}/relevamiento`} replace />;
  }

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? 'Presupuesto'} volverA={`/obras/${idObra}`} />
      <main className="contenido">
        {error && <p className="texto-error">{error}</p>}
        {obra && presupuesto === null && (
          <p className="texto-secundario">
            {esCliente ? 'El arquitecto todavía no presentó el presupuesto.' : 'Todavía no se solicitaron los costos.'}
          </p>
        )}
        {obra && presupuesto && obra.esArquitecto && (
          <VistaArquitecto idObra={idObra} presupuesto={presupuesto} tareas={tareas} alCambiar={setPresupuesto} />
        )}
        {obra && presupuesto && !obra.esArquitecto && esCliente && (
          <VistaCliente idObra={idObra} presupuesto={presupuesto} alCambiar={setPresupuesto} />
        )}
        {obra && presupuesto && !obra.esArquitecto && !esCliente && (
          <VistaColaborador idObra={idObra} presupuesto={presupuesto} tareas={tareas} alCambiar={recargar} />
        )}
      </main>
    </div>
  );
}
