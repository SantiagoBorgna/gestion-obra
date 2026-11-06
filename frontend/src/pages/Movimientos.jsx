import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import DialogoConfirmacion from '../componentes/DialogoConfirmacion.jsx';
import { IconoPuntos } from '../componentes/Iconos.jsx';
import FormularioMovimiento from '../componentes/pagos/FormularioMovimiento.jsx';
import { api } from '../api.js';
import { RUBROS, formatearFecha, formatearMes, formatearMonto } from '../constantes.js';

// Cobros al cliente (HU-08, tipo INGRESO) y pagos a colaboradores (HU-09, tipo EGRESO).
// El backend le manda a cada perfil solo lo que puede ver.
export default function Movimientos({ tipo }) {
  const { idObra } = useParams();
  const esCobro = tipo === 'INGRESO';
  const [obra, setObra] = useState(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [aAnular, setAAnular] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [errorAnular, setErrorAnular] = useState('');
  const [enviando, setEnviando] = useState(false);

  const recargar = useCallback(async () => {
    setDatos(await api(`/obras/${idObra}/pagos`));
  }, [idObra]);

  useEffect(() => {
    Promise.all([api(`/obras/${idObra}`).then(setObra), recargar()]).catch((e) => setError(e.message));
  }, [idObra, recargar]);

  async function guardar(formData) {
    await api(`/obras/${idObra}/pagos`, { metodo: 'POST', datos: formData });
    setRegistrando(false);
    await recargar();
  }

  const cancelarAnulacion = useCallback(() => {
    setAAnular(null);
    setMotivo('');
    setErrorAnular('');
  }, []);

  async function anular() {
    setErrorAnular('');
    setEnviando(true);
    try {
      await api(`/obras/${idObra}/pagos/${aAnular.id}/anular`, { metodo: 'POST', datos: { motivo } });
      cancelarAnulacion();
      await recargar();
    } catch (e) {
      setErrorAnular(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const esArquitecto = obra?.esArquitecto;
  const lista = (esCobro ? datos?.cobros : datos?.pagos) ?? [];
  const vigentes = lista.filter((m) => m.estado === 'VIGENTE');
  const total = vigentes.reduce((suma, m) => suma + Number(m.monto), 0);
  const titulosCobro = esArquitecto ? 'Cobros al cliente' : 'Mis pagos';
  const titulosPago = esArquitecto ? 'Pagos a colaboradores' : 'Pagos recibidos';
  const titulo = !obra ? '' : esCobro ? titulosCobro : titulosPago;

  // Del movimiento más nuevo al más viejo.
  const porMes = [...lista]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
    .reduce((meses, movimiento) => {
      const clave = movimiento.fecha.slice(0, 7);
      const ultimo = meses[meses.length - 1];
      if (ultimo?.clave === clave) ultimo.movimientos.push(movimiento);
      else meses.push({ clave, movimientos: [movimiento] });
      return meses;
    }, []);

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? titulo} volverA={`/obras/${idObra}`} />
      <main className="contenido">
        <h1 className="titulo-pantalla">{titulo}</h1>
        {error && <p className="texto-error">{error}</p>}
        {datos && !datos.habilitado && (
          <p className="texto-secundario">Los cobros y pagos se habilitan cuando el cliente aprueba el presupuesto.</p>
        )}
        {obra && datos?.habilitado && (
          <>
            <div className="tarjeta">
              <div className="tarjeta-fila">
                <div>
                  <div className="texto-secundario">{esCobro ? 'Total cobrado' : 'Total pagado'}</div>
                  <div className="texto-suave">
                    {vigentes.length} {esCobro
                      ? (vigentes.length === 1 ? 'pago registrado' : 'pagos registrados')
                      : (vigentes.length === 1 ? 'pago vigente' : 'pagos vigentes')}
                  </div>
                </div>
                <span className="dato-grande">{formatearMonto(total)}</span>
              </div>
              {esCobro && Number(datos.resumen.porCobrar) > 0 && (
                <span className="texto-suave">Falta cobrar {formatearMonto(datos.resumen.porCobrar)} del total de {formatearMonto(datos.resumen.totalPresupuesto)}</span>
              )}
            </div>

            {esArquitecto && !registrando && (
              <button type="button" className="boton" onClick={() => setRegistrando(true)}>+ Registrar pago</button>
            )}
            {registrando && (
              <FormularioMovimiento tipo={tipo} rubros={datos.rubros} alGuardar={guardar} alCancelar={() => setRegistrando(false)} />
            )}

            <h2 className="titulo-seccion seccion">Historial de pagos</h2>
            {lista.length === 0 && <p className="texto-secundario">Todavía no hay pagos registrados.</p>}
            <div>
              {porMes.map(({ clave, movimientos }) => (
                <div key={clave}>
                  <div className="fila-mes">
                    <strong>{formatearMes(`${clave}-01`)}</strong>
                    <span>{formatearMonto(movimientos.filter((m) => m.estado === 'VIGENTE').reduce((s, m) => s + Number(m.monto), 0))}</span>
                  </div>
                  {movimientos.map((movimiento) => (
                    <FilaMovimiento
                      key={movimiento.id}
                      idObra={idObra}
                      movimiento={movimiento}
                      esCobro={esCobro}
                      esArquitecto={esArquitecto}
                      alAnular={setAAnular}
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      {aAnular && (
        <DialogoConfirmacion
          titulo="Anular movimiento"
          mensaje={`Vas a anular ${formatearMonto(aAnular.monto)}. Queda registrado pero deja de sumar a los totales, y no se puede deshacer.`}
          textoConfirmar="Anular"
          enviando={enviando}
          deshabilitado={!motivo.trim()}
          alConfirmar={anular}
          alCancelar={cancelarAnulacion}
        >
          <label className="campo">
            <span>Motivo</span>
            <textarea value={motivo} rows={2} maxLength={500} onChange={(e) => setMotivo(e.target.value)} />
          </label>
          {errorAnular && <p className="texto-error">{errorAnular}</p>}
        </DialogoConfirmacion>
      )}
    </div>
  );
}

function FilaMovimiento({ idObra, movimiento, esCobro, esArquitecto, alAnular }) {
  const [verArchivos, setVerArchivos] = useState(false);
  const [menu, setMenu] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;
    function alTocarAfuera(evento) {
      if (!contenedor.current?.contains(evento.target)) setMenu(false);
    }
    document.addEventListener('mousedown', alTocarAfuera);
    return () => document.removeEventListener('mousedown', alTocarAfuera);
  }, [menu]);

  const anulado = movimiento.estado === 'ANULADO';
  const nombre = esCobro || !esArquitecto ? movimiento.descripcion : movimiento.colaborador;
  const comprobantes = movimiento.comprobantes;
  const palabra = esCobro ? 'comprobante' : 'recibo';
  const hrefDe = (comprobante) => `/api/obras/${idObra}/pagos/${movimiento.id}/comprobantes/${comprobante.id}`;
  const etiqueta = `${comprobantes.length} ${palabra}${comprobantes.length === 1 ? '' : 's'}`;

  return (
    <div className="fila-movimiento">
      <div className="fila-principal">
        <strong className={anulado ? 'texto-tachado' : ''}>{nombre}</strong>
        <strong className={anulado ? 'texto-tachado' : ''}>{formatearMonto(movimiento.monto)}</strong>
      </div>
      {anulado && (
        <span className="texto-error">Anulado el {formatearFecha(movimiento.fechaAnulacion)} · {movimiento.motivoAnulacion}</span>
      )}
      <div className="movimiento-detalle" ref={contenedor}>
        <span>
          {movimiento.rubro && `${RUBROS[movimiento.rubro]} · `}{formatearFecha(movimiento.fecha)} ·{' '}
          {comprobantes.length === 1 ? (
            <a className="enlace" href={hrefDe(comprobantes[0])} target="_blank" rel="noopener noreferrer">{etiqueta}</a>
          ) : (
            <button type="button" className="enlace" onClick={() => setVerArchivos(!verArchivos)}>{etiqueta}</button>
          )}
        </span>
        {esArquitecto && !anulado && (
          <button type="button" className="boton-puntos" onClick={() => setMenu(!menu)} aria-label="Opciones" aria-expanded={menu}>
            <IconoPuntos />
          </button>
        )}
        {menu && (
          <div className="menu-flotante">
            <button type="button" className="menu-flotante-opcion menu-flotante-peligro" onClick={() => { setMenu(false); alAnular(movimiento); }}>Anular</button>
          </div>
        )}
      </div>
      {verArchivos && (
        <div className="lista-comprobantes">
          {comprobantes.map((comprobante) => (
            <a key={comprobante.id} className="enlace" href={hrefDe(comprobante)} target="_blank" rel="noopener noreferrer">{comprobante.nombre}</a>
          ))}
        </div>
      )}
    </div>
  );
}
