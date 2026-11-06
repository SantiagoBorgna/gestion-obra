import { useState } from 'react';
import CampoMonto from '../CampoMonto.jsx';
import { api } from '../../api.js';
import { formatearMonto } from '../../constantes.js';

// Costos de las tareas de un rubro (HU-05): se guardan todos juntos y el total se actualiza al escribir.
// Se puede enviar incompleto: lo cargado queda guardado y el rubro sigue sin cargar hasta completarlo.
export default function FormularioEstimacion({ idObra, tareas, textoBoton, alGuardar, alCancelar }) {
  const [montos, setMontos] = useState(() => Object.fromEntries(
    tareas.map((t) => [t.id, t.montoEstimado === null ? '' : String(t.montoEstimado)]),
  ));
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const total = tareas.reduce((suma, t) => suma + (Number(montos[t.id]) || 0), 0);
  const faltantes = tareas.filter((t) => montos[t.id] === '').length;

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    const costos = tareas
      .filter((t) => montos[t.id] !== '')
      .map((t) => ({ idTarea: t.id, monto: montos[t.id] }));
    if (costos.length === 0) {
      setError('Cargá al menos un costo.');
      return;
    }
    setEnviando(true);
    try {
      await api(`/obras/${idObra}/tareas/costos`, { metodo: 'PUT', datos: { costos } });
      await alGuardar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <div className="tarjeta tarjeta-costos">
        {tareas.map((tarea) => (
          <label key={tarea.id} className="campo">
            <span>{tarea.descripcion}</span>
            <CampoMonto valor={montos[tarea.id]} alCambiar={(valor) => setMontos({ ...montos, [tarea.id]: valor })} />
          </label>
        ))}
      </div>
      <div className="total-seccion"><span>Total del rubro</span><strong>{formatearMonto(total)}</strong></div>
      {faltantes > 0 && (
        <p className="texto-ambar">
          {faltantes === 1 ? 'Falta cargar el costo de 1 tarea.' : `Falta cargar el costo de ${faltantes} tareas.`}
        </p>
      )}
      {error && <p className="texto-error">{error}</p>}
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? 'Guardando…' : textoBoton}
      </button>
      {alCancelar && <button type="button" className="boton" onClick={alCancelar}>Cancelar</button>}
    </form>
  );
}
