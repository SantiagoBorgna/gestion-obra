import { useState } from 'react';
import FormularioEstimacion from './FormularioEstimacion.jsx';
import { api } from '../../api.js';
import { COLOR_ESTADO, ESTADOS_ITEM, ESTADOS_PRESUPUESTO, RUBROS, formatearFecha, formatearMonto } from '../../constantes.js';

// Seguimiento de los rubros, honorarios (HU-13), consolidación (HU-06) y presentación (HU-07).
export default function VistaArquitecto({ idObra, presupuesto, tareas, alCambiar, alRecargar }) {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(null);

  const rubros = presupuesto.items.filter((item) => item.tipo === 'RUBRO');
  const honorarios = presupuesto.items.find((item) => item.tipo === 'HONORARIOS');
  const { estado } = presupuesto;
  const enEstimacion = estado === 'EN_ESTIMACION';
  const rubrosFaltantes = rubros.filter((item) => item.estado !== 'CONFIRMADO').map((item) => RUBROS[item.rubro]);
  const puedeConsolidar = enEstimacion && honorarios && rubrosFaltantes.length === 0;

  async function costosGuardados() {
    setEditando(null);
    await alRecargar();
  }

  async function ejecutar(ruta, opciones = { metodo: 'POST' }) {
    setError('');
    setEnviando(true);
    try {
      alCambiar(await api(`/obras/${idObra}/presupuesto${ruta}`, opciones));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <h2 className="titulo-seccion">Estado</h2>
      <div className="tarjeta">
        <div className="tarjeta-fila">
          <span className="texto-secundario">Solicitado el {formatearFecha(presupuesto.fechaCreacion)}</span>
          <span className={`etiqueta ${COLOR_ESTADO[estado]}`}>{ESTADOS_PRESUPUESTO[estado]}</span>
        </div>
        {presupuesto.fechaPresentacion && !enEstimacion && estado !== 'CONSOLIDADO' && <span className="texto-suave">Presentado el {formatearFecha(presupuesto.fechaPresentacion)}</span>}
        {presupuesto.fechaAprobacion && <span className="texto-suave">Aprobado el {formatearFecha(presupuesto.fechaAprobacion)}</span>}
      </div>
      {presupuesto.motivoRechazo && (
        <p className="aviso aviso-rojo"><strong>Motivo del rechazo:</strong> {presupuesto.motivoRechazo}</p>
      )}

      <h2 className="titulo-seccion">Rubros</h2>
      {rubros.map((item) => (
        <div key={item.id} className="tarjeta">
          <div className="tarjeta-fila">
            <strong>{RUBROS[item.rubro]}</strong>
            <span className={`etiqueta ${COLOR_ESTADO[item.estado]}`}>{ESTADOS_ITEM[item.estado]}</span>
          </div>
          <span className="texto-suave">Responsable: {item.responsable}</span>
          {item.fechaActualizacion && <span className="texto-suave">Actualizado: {formatearFecha(item.fechaActualizacion)}</span>}
          {editando === item.id ? (
            <FormularioEstimacion idObra={idObra} tareas={tareas.filter((t) => t.rubro === item.rubro)}
                                  textoBoton="Guardar" alGuardar={costosGuardados} alCancelar={() => setEditando(null)} />
          ) : (
            <>
              <ul className="lista-tareas">
                {tareas.filter((t) => t.rubro === item.rubro).map((t) => (
                  <li key={t.id} className="fila-monto">
                    <span>{t.descripcion}</span>
                    <span>{formatearMonto(t.montoEstimado)}</span>
                  </li>
                ))}
              </ul>
              <div className="fila-monto"><span>Monto del rubro</span><strong>{formatearMonto(item.monto)}</strong></div>
            </>
          )}
          {enEstimacion && editando !== item.id && (
            <button type="button" className="boton boton-chico" onClick={() => setEditando(item.id)}>
              {item.estado === 'SIN_CARGAR' ? 'Cargar' : 'Editar'}
            </button>
          )}
          {enEstimacion && item.estado === 'PENDIENTE_CONFIRMACION' && (
            <button type="button" className="boton boton-chico boton-verde" disabled={enviando}
                    onClick={() => ejecutar(`/items/${item.id}/confirmar`)}>
              Confirmar rubro
            </button>
          )}
        </div>
      ))}

      <h2 className="titulo-seccion">Honorarios</h2>
      {enEstimacion ? (
        <FormularioHonorarios
          actual={honorarios?.monto}
          enviando={enviando}
          alGuardar={(monto) => ejecutar('/honorarios', { metodo: 'PUT', datos: { monto } })}
        />
      ) : (
        <div className="tarjeta"><div className="fila-monto"><span>Honorarios</span><strong>{formatearMonto(honorarios?.monto)}</strong></div></div>
      )}

      <h2 className="titulo-seccion">Total</h2>
      <div className="tarjeta"><div className="fila-total"><span>Total</span><span>{formatearMonto(presupuesto.total)}</span></div></div>

      {error && <p className="texto-error">{error}</p>}

      <div className="acciones">
        {enEstimacion && (
          <>
            <button type="button" className="boton boton-primario" disabled={enviando || !puedeConsolidar}
                    onClick={() => ejecutar('/consolidar')}>
              Consolidar presupuesto
            </button>
            {!puedeConsolidar && (
              <p className="texto-ambar">
                Para consolidar falta completar: {[...rubrosFaltantes, ...(honorarios ? [] : ['Honorarios'])].join(', ')}.
              </p>
            )}
          </>
        )}
        {estado === 'CONSOLIDADO' && (
          <button type="button" className="boton boton-primario" disabled={enviando} onClick={() => ejecutar('/presentar')}>
            Presentar al cliente
          </button>
        )}
        {(estado === 'CONSOLIDADO' || estado === 'RECHAZADO') && (
          <button type="button" className="boton" disabled={enviando} onClick={() => ejecutar('/volver-a-estimacion')}>
            Volver a estimación
          </button>
        )}
        {estado === 'PRESENTADO' && <p className="aviso">Esperando la respuesta del cliente.</p>}
      </div>
    </>
  );
}

function FormularioHonorarios({ actual, enviando, alGuardar }) {
  const [monto, setMonto] = useState(actual ?? '');

  return (
    <form className="form-en-linea" onSubmit={(e) => { e.preventDefault(); alGuardar(monto); }}>
      <label className="campo">
        <span>Monto de los honorarios</span>
        <input type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
      </label>
      <button type="submit" className="boton" disabled={enviando}>Guardar</button>
    </form>
  );
}
