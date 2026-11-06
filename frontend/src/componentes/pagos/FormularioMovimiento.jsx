import { useState } from 'react';
import CampoMonto from '../CampoMonto.jsx';
import { RUBROS, fechaDeHoy, formatearMonto } from '../../constantes.js';

const TAMANIO_MAXIMO = 10 * 1024 * 1024;
const CANTIDAD_MAXIMA = 5;

const claveArchivo = (archivo) => `${archivo.name}-${archivo.size}-${archivo.lastModified}`;

function formatearPeso(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

// Alta de un cobro (INGRESO) o de un pago a un colaborador (EGRESO), con comprobante obligatorio.
export default function FormularioMovimiento({ tipo, rubros, alGuardar, alCancelar }) {
  const esPago = tipo === 'EGRESO';
  const [idItem, setIdItem] = useState('');
  const [fecha, setFecha] = useState(fechaDeHoy());
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const rubro = rubros.find((r) => String(r.idItem) === idItem);
  const sobrantes = Math.max(0, archivos.length - CANTIDAD_MAXIMA);
  const hayPesados = archivos.some((archivo) => archivo.size > TAMANIO_MAXIMO);

  // Los archivos elegidos se suman a los anteriores. Se limpia el selector para poder volver a elegir uno que se quitó.
  function elegirArchivos(evento) {
    const elegidos = new Map(archivos.map((archivo) => [claveArchivo(archivo), archivo]));
    [...evento.target.files].forEach((archivo) => elegidos.set(claveArchivo(archivo), archivo));
    setArchivos([...elegidos.values()]);
    setError('');
    evento.target.value = '';
  }

  function quitarArchivo(clave) {
    setArchivos(archivos.filter((archivo) => claveArchivo(archivo) !== clave));
    setError('');
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    if (archivos.length === 0) {
      setError(`Adjuntá al menos ${esPago ? 'un recibo' : 'un comprobante'}.`);
      return;
    }
    const datos = new FormData();
    datos.append('tipo', tipo);
    if (esPago) datos.append('idItem', idItem);
    datos.append('fecha', fecha);
    datos.append('monto', monto);
    datos.append('descripcion', descripcion);
    archivos.forEach((archivo) => datos.append('archivos', archivo));

    setEnviando(true);
    try {
      await alGuardar(datos);
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={enviar}>
      {esPago && (
        <label className="campo">
          <span>Rubro</span>
          <select value={idItem} onChange={(e) => setIdItem(e.target.value)} required>
            <option value="" disabled>Elegí un rubro</option>
            {rubros.map((r) => <option key={r.idItem} value={r.idItem}>{RUBROS[r.rubro]}</option>)}
          </select>
          {rubro && (
            <small className="texto-suave">
              Se le paga a {rubro.responsable}. Presupuestado: {formatearMonto(rubro.presupuestado)} · Gastado: {formatearMonto(rubro.gastoReal)}
            </small>
          )}
        </label>
      )}
      <label className="campo">
        <span>Fecha</span>
        <input type="date" value={fecha} max={fechaDeHoy()} onChange={(e) => setFecha(e.target.value)} required />
      </label>
      <label className="campo">
        <span>Monto</span>
        <CampoMonto valor={monto} alCambiar={setMonto} required />
      </label>
      <label className="campo">
        <span>Descripción</span>
        <input value={descripcion} maxLength={300} onChange={(e) => setDescripcion(e.target.value)} required />
      </label>
      <div className="campo">
        <span>{esPago ? 'Recibos' : 'Comprobantes'} (PDF, JPG o PNG, hasta {CANTIDAD_MAXIMA} de 10 MB cada uno)</span>
        <input id="archivos-movimiento" type="file" className="oculto-visual" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={elegirArchivos} />
        <label htmlFor="archivos-movimiento" className="boton boton-chico boton-adjuntar">+ Adjuntar archivos</label>
        {archivos.length > 0 && (
          <ul className="archivos-elegidos">
            {archivos.map((archivo) => (
              <li key={claveArchivo(archivo)} className={`archivo-elegido ${archivo.size > TAMANIO_MAXIMO ? 'archivo-pesado' : ''}`}>
                <span>{archivo.name}<span className="archivo-peso">{formatearPeso(archivo.size)}</span></span>
                <button type="button" className="boton-icono" onClick={() => quitarArchivo(claveArchivo(archivo))} aria-label={`Quitar ${archivo.name}`}>✕</button>
              </li>
            ))}
          </ul>
        )}
        {sobrantes > 0 && <p className="texto-error">Podés adjuntar hasta {CANTIDAD_MAXIMA}: quitá {sobrantes}.</p>}
        {hayPesados && <p className="texto-error">Cada archivo puede pesar como máximo 10 MB: quitá los marcados en rojo.</p>}
      </div>
      {error && <p className="texto-error">{error}</p>}
      <div className="form-en-linea">
        <button type="button" className="boton" onClick={alCancelar}>Cancelar</button>
        <button type="submit" className="boton boton-fuerte boton-positivo" disabled={enviando || sobrantes > 0 || hayPesados}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
