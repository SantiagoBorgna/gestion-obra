import { useState } from 'react';
import { api } from '../../api.js';
import { COLOR_ESTADO, ESTADOS_PRESUPUESTO, RUBROS, formatearFecha, formatearMonto } from '../../constantes.js';

// Revisión del presupuesto (HU-07): el cliente ve montos por rubro, honorarios y total, y responde.
export default function VistaCliente({ idObra, presupuesto, alCambiar }) {
  const [paso, setPaso] = useState('inicio');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function responder(ruta, datos) {
    setError('');
    setEnviando(true);
    try {
      alCambiar(await api(`/obras/${idObra}/presupuesto/${ruta}`, { metodo: 'POST', datos }));
      setPaso('inicio');
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const { estado } = presupuesto;

  return (
    <>
      <h2 className="titulo-seccion">Presupuesto</h2>
      <div className="tarjeta">
        <div className="tarjeta-fila">
          <span className="texto-suave">Presentado el {formatearFecha(presupuesto.fechaPresentacion)}</span>
          <span className={`etiqueta ${COLOR_ESTADO[estado]}`}>{ESTADOS_PRESUPUESTO[estado]}</span>
        </div>
        {presupuesto.items.map((item) => (
          <div key={item.id} className="fila-monto">
            <span>{item.tipo === 'HONORARIOS' ? 'Honorarios' : RUBROS[item.rubro]}</span>
            <strong>{formatearMonto(item.monto)}</strong>
          </div>
        ))}
        <div className="fila-total"><span>Total</span><span>{formatearMonto(presupuesto.total)}</span></div>
      </div>

      {estado === 'APROBADO' && (
        <p className="aviso">Aprobaste este presupuesto el {formatearFecha(presupuesto.fechaAprobacion)}.</p>
      )}
      {estado === 'RECHAZADO' && (
        <p className="aviso aviso-rojo"><strong>Lo rechazaste por este motivo:</strong> {presupuesto.motivoRechazo}</p>
      )}

      {estado === 'PRESENTADO' && paso === 'inicio' && (
        <div className="acciones">
          <button type="button" className="boton boton-verde" onClick={() => setPaso('aprobar')}>Aprobar presupuesto</button>
          <button type="button" className="boton boton-peligro" onClick={() => setPaso('rechazar')}>Rechazar presupuesto</button>
        </div>
      )}

      {estado === 'PRESENTADO' && paso === 'aprobar' && (
        <div className="acciones">
          <p className="aviso">Una vez aprobado, el presupuesto no se puede modificar. ¿Confirmás la aprobación?</p>
          <button type="button" className="boton boton-verde" disabled={enviando} onClick={() => responder('aprobar')}>Sí, aprobar</button>
          <button type="button" className="boton" onClick={() => setPaso('inicio')}>Cancelar</button>
        </div>
      )}

      {estado === 'PRESENTADO' && paso === 'rechazar' && (
        <form className="formulario" onSubmit={(e) => { e.preventDefault(); responder('rechazar', { motivo }); }}>
          <label className="campo">
            <span>Motivo del rechazo</span>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} maxLength={500} required />
          </label>
          <button type="submit" className="boton boton-peligro" disabled={enviando}>Confirmar rechazo</button>
          <button type="button" className="boton" onClick={() => setPaso('inicio')}>Cancelar</button>
        </form>
      )}

      {error && <p className="texto-error">{error}</p>}
    </>
  );
}
