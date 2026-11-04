import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import SelectorRubro from '../componentes/SelectorRubro.jsx';
import { api } from '../api.js';
import { RUBROS } from '../constantes.js';

const TAREA_VACIA = { descripcion: '', rubro: '' };

// Relevamiento del alcance (HU-04): las tareas se editan hasta que se solicitan los costos.
export default function Relevamiento() {
  const { idObra } = useParams();
  const navegar = useNavigate();
  const [obra, setObra] = useState(null);
  const [tareas, setTareas] = useState(null);
  const [solicitado, setSolicitado] = useState(false);
  const [nueva, setNueva] = useState(TAREA_VACIA);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([
      api(`/obras/${idObra}`),
      api(`/obras/${idObra}/presupuesto`),
      api(`/obras/${idObra}/tareas`),
    ])
      .then(([datosObra, presupuesto, datosTareas]) => {
        setObra(datosObra);
        setSolicitado(presupuesto !== null);
        setTareas(datosTareas);
      })
      .catch((e) => setError(e.message));
  }, [idObra]);

  if (solicitado) return <Navigate to={`/obras/${idObra}/presupuesto`} replace />;

  async function agregar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const tarea = await api(`/obras/${idObra}/tareas`, { metodo: 'POST', datos: nueva });
      setTareas([...tareas, tarea]);
      setNueva({ descripcion: '', rubro: nueva.rubro });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function guardarEdicion(evento) {
    evento.preventDefault();
    setError('');
    try {
      const tarea = await api(`/obras/${idObra}/tareas/${editando.id}`, {
        metodo: 'PUT',
        datos: { descripcion: editando.descripcion, rubro: editando.rubro },
      });
      setTareas(tareas.map((t) => (t.id === tarea.id ? tarea : t)));
      setEditando(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function eliminar(tarea) {
    setError('');
    try {
      await api(`/obras/${idObra}/tareas/${tarea.id}`, { metodo: 'DELETE' });
      setTareas(tareas.filter((t) => t.id !== tarea.id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function solicitarCostos() {
    setError('');
    setEnviando(true);
    try {
      await api(`/obras/${idObra}/presupuesto/solicitar-costos`, { metodo: 'POST' });
      navegar(`/obras/${idObra}/presupuesto`, { replace: true });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? 'Relevamiento'} volverA={`/obras/${idObra}`} />
      <main className="contenido">
        <h2 className="titulo-seccion">Tareas del relevamiento</h2>
        {tareas?.length === 0 && <p className="texto-secundario">Todavía no cargaste ninguna tarea.</p>}
        {tareas?.map((tarea) => (
          editando?.id === tarea.id ? (
            <form key={tarea.id} onSubmit={guardarEdicion} className="tarjeta formulario">
              <label className="campo">
                <span>Descripción</span>
                <textarea value={editando.descripcion} rows={2} maxLength={500} required
                          onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })} />
              </label>
              <SelectorRubro valor={editando.rubro} alCambiar={(rubro) => setEditando({ ...editando, rubro })} />
              <div className="form-en-linea">
                <button type="submit" className="boton boton-primario">Guardar</button>
                <button type="button" className="boton" onClick={() => setEditando(null)}>Cancelar</button>
              </div>
            </form>
          ) : (
            <div key={tarea.id} className="tarjeta">
              <span>{tarea.descripcion}</span>
              <span className="texto-suave">{RUBROS[tarea.rubro]}</span>
              <div className="form-en-linea">
                <button type="button" className="boton boton-chico" onClick={() => setEditando(tarea)}>Editar</button>
                <button type="button" className="boton boton-chico boton-peligro" onClick={() => eliminar(tarea)}>Eliminar</button>
              </div>
            </div>
          )
        ))}

        {tareas && (
          <form onSubmit={agregar} className="formulario">
            <h2 className="titulo-seccion">Agregar tarea</h2>
            <label className="campo">
              <span>Descripción</span>
              <textarea value={nueva.descripcion} rows={2} maxLength={500} required
                        onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} />
            </label>
            <SelectorRubro valor={nueva.rubro} alCambiar={(rubro) => setNueva({ ...nueva, rubro })} />
            <button type="submit" className="boton" disabled={enviando}>Agregar tarea</button>
          </form>
        )}

        {error && <p className="texto-error">{error}</p>}

        {tareas && (
          <>
            <h2 className="titulo-seccion">Siguiente paso</h2>
            <p className="texto-suave">
              Al solicitar los costos, las tareas ya no se pueden modificar y cada responsable recibe un aviso por correo.
            </p>
            <button type="button" className="boton boton-primario" onClick={solicitarCostos}
                    disabled={enviando || tareas.length === 0}>
              Solicitar costos
            </button>
          </>
        )}
      </main>
    </div>
  );
}
