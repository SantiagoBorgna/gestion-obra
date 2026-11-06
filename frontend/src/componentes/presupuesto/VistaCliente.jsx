import { useCallback, useState } from 'react';
import DialogoConfirmacion from '../DialogoConfirmacion.jsx';
import { api } from '../../api.js';
import { RUBROS, formatearFecha, formatearMonto } from '../../constantes.js';

// Revisión del presupuesto (HU-07): cada barra muestra la parte del total que ocupa el rubro.
export default function VistaCliente({ idObra, presupuesto, arquitecto, alCambiar }) {
  const [dialogo, setDialogo] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cerrar = useCallback(() => {
    setDialogo(null);
    setError('');
  }, []);

  async function responder(ruta, datos) {
    setError('');
    setEnviando(true);
    try {
      alCambiar(await api(`/obras/${idObra}/presupuesto/${ruta}`, { metodo: 'POST', datos }));
      cerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const { estado, total } = presupuesto;
  const items = [...presupuesto.items].sort((a, b) => b.monto - a.monto);

  return (
    <>
      <h1 className="titulo-pantalla">Presupuesto</h1>
      <div className="tarjeta">
        <span className="dato-titulo">Total de la obra</span>
        <span className="dato-grande">{formatearMonto(total)}</span>
        <span className="texto-suave">Presentado por Arq. {arquitecto} el {formatearFecha(presupuesto.fechaPresentacion)}</span>
      </div>

      <h2 className="titulo-seccion seccion">Detalle por rubro</h2>
      <div>
        {items.map((item) => (
          <div key={item.id} className="fila-lista">
            <div className="fila-principal">
              <span>{item.tipo === 'HONORARIOS' ? 'Honorarios del arquitecto' : RUBROS[item.rubro]}</span>
              <span>{formatearMonto(item.monto)}</span>
            </div>
            <div className="barra"><div className="barra-relleno barra-rubro" style={{ width: `${(item.monto / total) * 100}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="pie-pantalla">
        {estado === 'APROBADO' && <p className="aviso">Aprobaste este presupuesto el {formatearFecha(presupuesto.fechaAprobacion)}.</p>}
        {estado === 'RECHAZADO' && (
          <p className="aviso aviso-rojo"><strong>Lo rechazaste por este motivo:</strong> {presupuesto.motivoRechazo}</p>
        )}
        {estado === 'PRESENTADO' && (
          <>
            <button type="button" className="boton" onClick={() => setDialogo('aprobar')}>Aprobar presupuesto</button>
            <button type="button" className="enlace enlace-gris" onClick={() => setDialogo('rechazar')}>Rechazar e indicar el motivo</button>
          </>
        )}
      </div>

      {dialogo === 'aprobar' && (
        <DialogoConfirmacion
          titulo="Aprobar presupuesto"
          mensaje="Una vez aprobado, el presupuesto no se puede modificar. ¿Confirmás la aprobación?"
          textoConfirmar="Aprobar"
          enviando={enviando}
          alConfirmar={() => responder('aprobar')}
          alCancelar={cerrar}
        >
          {error && <p className="texto-error">{error}</p>}
        </DialogoConfirmacion>
      )}
      {dialogo === 'rechazar' && (
        <DialogoConfirmacion
          titulo="Rechazar presupuesto"
          mensaje="Indicá el motivo para que el arquitecto lo ajuste."
          textoConfirmar="Rechazar"
          enviando={enviando}
          deshabilitado={!motivo.trim()}
          alConfirmar={() => responder('rechazar', { motivo })}
          alCancelar={cerrar}
        >
          <label className="campo">
            <span>Motivo</span>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} maxLength={500} />
          </label>
          {error && <p className="texto-error">{error}</p>}
        </DialogoConfirmacion>
      )}
    </>
  );
}
