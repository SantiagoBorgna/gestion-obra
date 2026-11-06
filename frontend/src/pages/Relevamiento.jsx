import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import { IconoLapiz } from '../componentes/Iconos.jsx';
import SelectorRubro from '../componentes/SelectorRubro.jsx';
import { api } from '../api.js';
import { RUBROS } from '../constantes.js';

const TAREA_VACIA = { descripcion: '', rubro: '' };

// Relevamiento del alcance (HU-04): las tareas se editan hasta que se solicitan los costos; después quedan de consulta.
export default function Relevamiento() {
  const { idObra } = useParams();
  const navegar = useNavigate();
  const [obra, setObra] = useState(null);
  const [tareas, setTareas] = useState(null);
  const [solicitado, setSolicitado] = useState(false);
  const [nueva, setNueva] = useState(null);
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

  async function eliminar() {
    setError('');
    try {
      await api(`/obras/${idObra}/tareas/${editando.id}`, { metodo: 'DELETE' });
      setTareas(tareas.filter((t) => t.id !== editando.id));
      setEditando(null);
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

  const rubros = Object.keys(RUBROS).filter((rubro) => tareas?.some((t) => t.rubro === rubro));

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? 'Relevamiento'} volverA={`/obras/${idObra}`} />
      <main className="contenido">
        <div className="cabecera-pantalla">
          <h1 className="titulo-pantalla">Relevamiento</h1>
          {tareas && !solicitado && !nueva && (
            <button type="button" className="boton boton-chico" onClick={() => setNueva(TAREA_VACIA)}>+ Agregar tarea</button>
          )}
        </div>

        {nueva && (
          <form onSubmit={agregar} className="tarjeta formulario">
            <label className="campo">
              <span>Descripción</span>
              <textarea value={nueva.descripcion} rows={2} maxLength={500} required
                        onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} />
            </label>
            <SelectorRubro valor={nueva.rubro} alCambiar={(rubro) => setNueva({ ...nueva, rubro })} />
            <div className="form-en-linea">
              <button type="button" className="boton" onClick={() => setNueva(null)}>Cerrar</button>
              <button type="submit" className="boton boton-fuerte boton-positivo" disabled={enviando}>Agregar</button>
            </div>
          </form>
        )}

        {tareas && (
          <h2 className="titulo-seccion seccion">
            {tareas.length === 1 ? '1 tarea' : `${tareas.length} tareas`} en {rubros.length === 1 ? '1 rubro' : `${rubros.length} rubros`}
          </h2>
        )}
        {tareas?.length === 0 && <p className="texto-secundario">Todavía no cargaste ninguna tarea.</p>}

        {rubros.map((rubro) => (
          <section key={rubro} className="seccion">
            <h3 className="grupo-titulo"><span className="marcador" />{RUBROS[rubro]}</h3>
            <div className="tarjeta tarjeta-tareas">
              {tareas.filter((t) => t.rubro === rubro).map((tarea) => (
                editando?.id === tarea.id ? (
                  <form key={tarea.id} onSubmit={guardarEdicion} className="formulario fila-tarea-edicion">
                    <label className="campo">
                      <span>Descripción</span>
                      <textarea value={editando.descripcion} rows={2} maxLength={500} required
                                onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })} />
                    </label>
                    <SelectorRubro valor={editando.rubro} alCambiar={(valor) => setEditando({ ...editando, rubro: valor })} />
                    <div className="form-en-linea">
                      <button type="button" className="boton" onClick={() => setEditando(null)}>Cancelar</button>
                      <button type="submit" className="boton boton-fuerte boton-positivo">Guardar</button>
                    </div>
                    <button type="button" className="enlace enlace-eliminar" onClick={eliminar}>Eliminar tarea</button>
                  </form>
                ) : (
                  <div key={tarea.id} className="fila-tarea">
                    <span>{tarea.descripcion}</span>
                    {!solicitado && (
                      <button type="button" className="boton-icono" onClick={() => setEditando(tarea)} aria-label={`Editar ${tarea.descripcion}`}>
                        <IconoLapiz />
                      </button>
                    )}
                  </div>
                )
              ))}
            </div>
          </section>
        ))}

        {error && <p className="texto-error">{error}</p>}

        {tareas && !solicitado && (
          <div className="pie-pantalla">
            <button type="button" className="boton" onClick={solicitarCostos} disabled={enviando || tareas.length === 0}>
              Solicitar costos a colaboradores
            </button>
          </div>
        )}
        {solicitado && <p className="texto-suave">Los costos ya fueron solicitados: las tareas no se pueden modificar.</p>}
      </main>
    </div>
  );
}
