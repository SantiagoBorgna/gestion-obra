import { useRef, useState } from 'react';
import CampoMonto from '../CampoMonto.jsx';
import { RUBROS, fechaDeHoy, formatearMonto } from '../../constantes.js';

const TAMANIO_MAXIMO = 10 * 1024 * 1024;
const CANTIDAD_MAXIMA = 5;

// Alta de un cobro (INGRESO) o de un pago a un colaborador (EGRESO), con comprobante obligatorio.
export default function FormularioMovimiento({ tipo, rubros, alGuardar, alCancelar }) {
  const esPago = tipo === 'EGRESO';
  const [idItem, setIdItem] = useState('');
  const [fecha, setFecha] = useState(fechaDeHoy());
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const archivo = useRef(null);

  const rubro = rubros.find((r) => String(r.idItem) === idItem);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    const comprobantes = [...archivo.current.files];
    if (comprobantes.length > CANTIDAD_MAXIMA) {
      setError(`Podés adjuntar hasta ${CANTIDAD_MAXIMA} comprobantes.`);
      return;
    }
    if (comprobantes.some((comprobante) => comprobante.size > TAMANIO_MAXIMO)) {
      setError('Cada comprobante puede pesar como máximo 10 MB.');
      return;
    }
    const datos = new FormData();
    datos.append('tipo', tipo);
    if (esPago) datos.append('idItem', idItem);
    datos.append('fecha', fecha);
    datos.append('monto', monto);
    datos.append('descripcion', descripcion);
    comprobantes.forEach((comprobante) => datos.append('archivos', comprobante));

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
      <label className="campo">
        <span>{esPago ? 'Recibos' : 'Comprobantes'} (PDF, JPG o PNG, hasta 5 de 10 MB cada uno)</span>
        <input type="file" ref={archivo} accept=".pdf,.jpg,.jpeg,.png" multiple required />
      </label>
      {error && <p className="texto-error">{error}</p>}
      <div className="form-en-linea">
        <button type="button" className="boton" onClick={alCancelar}>Cancelar</button>
        <button type="submit" className="boton boton-fuerte" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
