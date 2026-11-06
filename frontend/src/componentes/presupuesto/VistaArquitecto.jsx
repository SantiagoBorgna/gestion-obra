import { useState } from 'react';
import CampoMonto from '../CampoMonto.jsx';
import FormularioEstimacion from './FormularioEstimacion.jsx';
import { api } from '../../api.js';
import { ESTADOS_ITEM, ESTADOS_PRESUPUESTO, RUBROS, formatearFecha, formatearMonto } from '../../constantes.js';

const COLOR_ITEM = { SIN_CARGAR: 'grupo-gris', PENDIENTE_CONFIRMACION: 'grupo-ambar', CONFIRMADO: 'grupo-verde' };

// Rubros, honorarios (HU-13), consolidación (HU-06) y presentación (HU-07).
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
      <div className="cabecera-pantalla">
        <h1 className="titulo-pantalla">Presupuesto</h1>
        {!enEstimacion && <span className="texto-secundario">{ESTADOS_PRESUPUESTO[estado]}</span>}
      </div>
      {presupuesto.motivoRechazo && (
        <p className="aviso aviso-rojo"><strong>Motivo del rechazo:</strong> {presupuesto.motivoRechazo}</p>
      )}

      <h2 className="titulo-seccion seccion">Rubros de la obra</h2>
      <div>
        {rubros.map((item) => (
          <div key={item.id} className="fila-lista">
            <div className="fila-principal">
              <strong>{RUBROS[item.rubro]}</strong>
              <strong>{item.estado === 'SIN_CARGAR' && Number(item.monto) === 0 ? '-' : formatearMonto(item.monto)}</strong>
            </div>
            <div className="fila-secundaria">
              <span className="estado-rubro">
                <span className={`grupo-titulo estado-chico ${COLOR_ITEM[item.estado]}`}><span className="marcador" />{ESTADOS_ITEM[item.estado]}</span>
                &nbsp;· {item.responsable}
              </span>
              {enEstimacion && editando !== item.id && (
                <span className="acciones-rubro">
                  {item.estado === 'PENDIENTE_CONFIRMACION' && (
                    <button type="button" className="accion-texto" disabled={enviando} onClick={() => ejecutar(`/items/${item.id}/confirmar`)}>Confirmar</button>
                  )}
                  <button type="button" className="accion-texto" onClick={() => setEditando(item.id)}>
                    {item.estado === 'SIN_CARGAR' ? 'Cargar' : 'Editar'}
                  </button>
                </span>
              )}
            </div>
            {item.fechaActualizacion && <span className="texto-suave">Actualizado: {formatearFecha(item.fechaActualizacion)}</span>}
            {editando === item.id && (
              <FormularioEstimacion idObra={idObra} tareas={tareas.filter((t) => t.rubro === item.rubro)}
                                    textoBoton="Guardar" alGuardar={costosGuardados} alCancelar={() => setEditando(null)} />
            )}
          </div>
        ))}
        <FilaHonorarios
          item={honorarios}
          editable={enEstimacion}
          enviando={enviando}
          alGuardar={(monto) => ejecutar('/honorarios', { metodo: 'PUT', datos: { monto } })}
        />
      </div>

      <div className="pie-pantalla">
        <div className="total-seccion"><span>Total presupuestado</span><strong>{formatearMonto(presupuesto.total)}</strong></div>
        {enEstimacion && !puedeConsolidar && (
          <p className="texto-ambar">
            Para consolidar falta completar: {[...rubrosFaltantes, ...(honorarios ? [] : ['Honorarios'])].join(', ')}.
          </p>
        )}
        {error && <p className="texto-error">{error}</p>}
        {enEstimacion && (
          <button type="button" className="boton" disabled={enviando || !puedeConsolidar} onClick={() => ejecutar('/consolidar')}>
            Consolidar presupuesto
          </button>
        )}
        {estado === 'CONSOLIDADO' && (
          <button type="button" className="boton" disabled={enviando} onClick={() => ejecutar('/presentar')}>Presentar al cliente</button>
        )}
        {(estado === 'CONSOLIDADO' || estado === 'RECHAZADO') && (
          <button type="button" className="boton" disabled={enviando} onClick={() => ejecutar('/volver-a-estimacion')}>Volver a estimación</button>
        )}
        {estado === 'PRESENTADO' && <p className="aviso">Presentado el {formatearFecha(presupuesto.fechaPresentacion)}. Esperando la respuesta del cliente.</p>}
        {estado === 'APROBADO' && <p className="aviso">Aprobado por el cliente el {formatearFecha(presupuesto.fechaAprobacion)}.</p>}
      </div>
    </>
  );
}

function FilaHonorarios({ item, editable, enviando, alGuardar }) {
  const [editando, setEditando] = useState(false);
  const [monto, setMonto] = useState('');

  function abrir() {
    setMonto(item ? String(item.monto) : '');
    setEditando(true);
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (await alGuardar(monto)) setEditando(false);
  }

  return (
    <div className="fila-lista">
      <div className="fila-principal">
        <strong>Honorarios del arquitecto</strong>
        <strong>{item ? formatearMonto(item.monto) : '-'}</strong>
      </div>
      <div className="fila-secundaria">
        <span className="estado-rubro">
          <span className={`grupo-titulo estado-chico ${item ? 'grupo-verde' : 'grupo-gris'}`}><span className="marcador" />{item ? 'Cargado' : 'Sin cargar'}</span>
          &nbsp;· Arquitecto a cargo
        </span>
        {editable && !editando && (
          <button type="button" className="accion-texto" onClick={abrir}>{item ? 'Editar' : 'Cargar'}</button>
        )}
      </div>
      {item?.fechaActualizacion && <span className="texto-suave">Actualizado: {formatearFecha(item.fechaActualizacion)}</span>}
      {editando && (
        <form className="formulario" onSubmit={enviar}>
          <label className="campo">
            <span>Monto de los honorarios</span>
            <CampoMonto valor={monto} alCambiar={setMonto} required />
          </label>
          <div className="form-en-linea">
            <button type="button" className="boton" onClick={() => setEditando(false)}>Cancelar</button>
            <button type="submit" className="boton boton-fuerte" disabled={enviando}>Guardar</button>
          </div>
        </form>
      )}
    </div>
  );
}
