import { useState } from 'react';
import { api } from '../../api.js';
import { formatearMonto } from '../../constantes.js';

// Costos de las tareas de un rubro (HU-05): se guardan todos juntos y el total se actualiza al escribir.
// Se puede enviar incompleto: lo cargado queda guardado y el rubro sigue sin cargar hasta completarlo.
export default function FormularioEstimacion({ idObra, tareas, textoBoton, alGuardar, alCancelar }) {
  const [montos, setMontos] = useState(() => Object.fromEntries(tareas.map((t) => [t.id, t.montoEstimado ?? ''])));
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
      {tareas.map((tarea) => (
        <label key={tarea.id} className="campo">
          <span>{tarea.descripcion}</span>
          <input type="number" min="0.01" step="0.01" placeholder="$ 0" value={montos[tarea.id]}
                 onChange={(e) => setMontos({ ...montos, [tarea.id]: e.target.value })} />
        </label>
      ))}
      <div className="fila-total"><span>Total del rubro</span><span>{formatearMonto(total)}</span></div>
      {faltantes > 0 && (
        <p className="texto-ambar">
          {faltantes === 1 ? 'Falta cargar el costo de 1 tarea.' : `Falta cargar el costo de ${faltantes} tareas.`}
        </p>
      )}
      {error && <p className="texto-error">{error}</p>}
      <button type="submit" className="boton boton-primario" disabled={enviando}>
        {enviando ? 'Guardando…' : textoBoton}
      </button>
      {alCancelar && <button type="button" className="boton" onClick={alCancelar}>Cancelar</button>}
    </form>
  );
}
