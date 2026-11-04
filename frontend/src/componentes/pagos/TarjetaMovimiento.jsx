import { RUBROS, formatearFecha, formatearMonto } from '../../constantes.js';

// Un cobro o un pago. Los anulados siguen a la vista, tachados y con su motivo.
export default function TarjetaMovimiento({ idObra, movimiento, alAnular }) {
  const anulado = movimiento.estado === 'ANULADO';

  return (
    <div className="tarjeta">
      <div className="tarjeta-fila">
        <strong className={anulado ? 'monto-anulado' : ''}>{formatearMonto(movimiento.monto)}</strong>
        {anulado && <span className="etiqueta etiqueta-rojo">Anulado</span>}
      </div>
      <span>{movimiento.descripcion}</span>
      {movimiento.rubro && (
        <span className="texto-secundario">{RUBROS[movimiento.rubro]} · {movimiento.colaborador}</span>
      )}
      <span className="texto-suave">{formatearFecha(movimiento.fecha)}</span>
      {anulado && (
        <span className="texto-error">
          Anulado el {formatearFecha(movimiento.fechaAnulacion)}: {movimiento.motivoAnulacion}
        </span>
      )}
      <div className="form-en-linea">
        <a className="boton boton-chico" href={`/api/obras/${idObra}/pagos/${movimiento.id}/comprobante`}
           target="_blank" rel="noopener noreferrer">
          Ver comprobante
        </a>
        {alAnular && !anulado && (
          <button type="button" className="boton boton-chico boton-peligro" onClick={() => alAnular(movimiento)}>Anular</button>
        )}
      </div>
    </div>
  );
}
