import { useState } from 'react';
import { api } from '../../api.js';
import { COLOR_ESTADO, ESTADOS_ITEM, RUBROS, formatearMonto } from '../../constantes.js';

// Carga de costos (HU-05): el colaborador solo ve las tareas de su rubro.
export default function VistaColaborador({ idObra, presupuesto, tareas, alCambiar }) {
  const item = presupuesto.items[0];
  const editable = presupuesto.estado === 'EN_ESTIMACION';

  if (!item) return <p className="texto-secundario">Esta obra no tiene tareas de tu rubro.</p>;

  return (
    <>
      <h2 className="titulo-seccion">{RUBROS[item.rubro]}</h2>
      <div className="tarjeta">
        <div className="tarjeta-fila">
          <strong>{formatearMonto(item.monto)}</strong>
          <span className={`etiqueta ${COLOR_ESTADO[item.estado]}`}>{ESTADOS_ITEM[item.estado]}</span>
        </div>
        {!editable && <span className="texto-suave">La estimación está cerrada: los costos ya no se pueden modificar.</span>}
        {editable && item.estado === 'CONFIRMADO' && (
          <span className="texto-suave">Si cambiás un costo, el arquitecto tiene que volver a confirmar el rubro.</span>
        )}
      </div>

      <h2 className="titulo-seccion">Tareas</h2>
      {tareas.map((tarea) => (
        <FilaTarea key={tarea.id} idObra={idObra} tarea={tarea} editable={editable} alGuardar={alCambiar} />
      ))}
    </>
  );
}

function FilaTarea({ idObra, tarea, editable, alGuardar }) {
  const [monto, setMonto] = useState(tarea.montoEstimado ?? '');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api(`/obras/${idObra}/tareas/${tarea.id}/costo`, { metodo: 'PUT', datos: { monto } });
      await alGuardar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tarjeta">
      <span>{tarea.descripcion}</span>
      {editable ? (
        <form className="form-en-linea" onSubmit={enviar}>
          <label className="campo">
            <span>Costo</span>
            <input type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          </label>
          <button type="submit" className="boton" disabled={enviando}>Guardar</button>
        </form>
      ) : (
        <div className="fila-monto"><span>Costo</span><strong>{formatearMonto(tarea.montoEstimado)}</strong></div>
      )}
      {error && <p className="texto-error">{error}</p>}
    </div>
  );
}
