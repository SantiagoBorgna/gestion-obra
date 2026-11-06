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
  const [aviso, setAviso] = useState('');

  const total = tareas.reduce((suma, t) => suma + (Number(montos[t.id]) || 0), 0);
  const faltantes = tareas.filter((t) => montos[t.id] === '').length;
  const textoFaltantes = faltantes === 1 ? '1 tarea' : `${faltantes} tareas`;

  function cambiarMonto(idTarea, valor) {
    setMontos({ ...montos, [idTarea]: valor });
    setAviso('');
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setAviso('');
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
      setAviso(faltantes === 0
        ? 'Costos enviados al arquitecto.'
        : `Costos guardados. Falta cargar ${textoFaltantes} para enviarlos al arquitecto.`);
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
            <CampoMonto valor={montos[tarea.id]} alCambiar={(valor) => cambiarMonto(tarea.id, valor)} />
          </label>
        ))}
      </div>
      <div className="pie-pantalla pie-estimacion">
        <div className="total-seccion"><span>Total del rubro</span><strong>{formatearMonto(total)}</strong></div>
        {aviso && <p className="aviso">{aviso}</p>}
        {!aviso && faltantes > 0 && <p className="texto-ambar">Falta cargar el costo de {textoFaltantes}.</p>}
        {error && <p className="texto-error">{error}</p>}
        {alCancelar ? (
          <div className="form-en-linea">
            <button type="button" className="boton" onClick={alCancelar}>Cancelar</button>
            <button type="submit" className="boton boton-fuerte boton-positivo" disabled={enviando}>
              {enviando ? 'Guardando…' : textoBoton}
            </button>
          </div>
        ) : (
          <button type="submit" className="boton" disabled={enviando}>
            {enviando ? 'Guardando…' : textoBoton}
          </button>
        )}
      </div>
    </form>
  );
}
