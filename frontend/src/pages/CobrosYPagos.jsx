import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import DialogoConfirmacion from '../componentes/DialogoConfirmacion.jsx';
import FormularioMovimiento from '../componentes/pagos/FormularioMovimiento.jsx';
import TarjetaMovimiento from '../componentes/pagos/TarjetaMovimiento.jsx';
import { api } from '../api.js';
import { formatearMonto } from '../constantes.js';

// Cobros al cliente y pagos a colaboradores (HU-08, HU-09). Cada perfil recibe del backend solo lo suyo.
export default function CobrosYPagos() {
  const { idObra } = useParams();
  const [obra, setObra] = useState(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [formulario, setFormulario] = useState(null);
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
    setFormulario(null);
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
  const resumen = datos?.resumen;
  const alAnular = esArquitecto ? setAAnular : undefined;
  const verCobros = esArquitecto || resumen?.totalCobrado !== null;
  const verPagos = esArquitecto || resumen?.totalPagado !== null;

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? 'Cobros y pagos'} volverA={`/obras/${idObra}`} />
      <main className="contenido">
        {error && <p className="texto-error">{error}</p>}
        {datos && !datos.habilitado && (
          <p className="texto-secundario">Los cobros y pagos se habilitan cuando el cliente aprueba el presupuesto.</p>
        )}
        {obra && datos?.habilitado && (
          <>
            <h2 className="titulo-seccion">Resumen</h2>
            <div className="tarjeta">
              <FilaResumen titulo="Total del presupuesto" monto={resumen.totalPresupuesto} />
              <FilaResumen titulo="Honorarios incluidos" monto={resumen.honorarios} />
              <FilaResumen titulo="Cobrado" monto={resumen.totalCobrado} />
              <FilaResumen titulo="Falta cobrar" monto={resumen.porCobrar} />
              <FilaResumen titulo={esArquitecto ? 'Pagado a colaboradores' : 'Cobrado por mi trabajo'} monto={resumen.totalPagado} />
              {resumen.saldo !== null && (
                <div className="fila-monto fila-saldo"><span>Saldo (cobrado − pagado)</span><strong>{formatearMonto(resumen.saldo)}</strong></div>
              )}
            </div>

            {verCobros && (
              <Seccion
                titulo="Cobros"
                vacio="Todavía no hay cobros registrados."
                movimientos={datos.cobros}
                idObra={idObra}
                alAnular={alAnular}
                accion={esArquitecto && (
                  formulario === 'INGRESO' ? (
                    <FormularioMovimiento key="INGRESO" tipo="INGRESO" rubros={datos.rubros} alGuardar={guardar} alCancelar={() => setFormulario(null)} />
                  ) : (
                    <button type="button" className="boton" onClick={() => setFormulario('INGRESO')}>Registrar cobro</button>
                  )
                )}
              />
            )}

            {verPagos && (
              <Seccion
                titulo={esArquitecto ? 'Pagos a colaboradores' : 'Mis cobros'}
                vacio="Todavía no hay pagos registrados."
                movimientos={datos.pagos}
                idObra={idObra}
                alAnular={alAnular}
                accion={esArquitecto && (
                  formulario === 'EGRESO' ? (
                    <FormularioMovimiento key="EGRESO" tipo="EGRESO" rubros={datos.rubros} alGuardar={guardar} alCancelar={() => setFormulario(null)} />
                  ) : (
                    <button type="button" className="boton" onClick={() => setFormulario('EGRESO')}>Registrar pago</button>
                  )
                )}
              />
            )}
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

function FilaResumen({ titulo, monto }) {
  if (monto === null || monto === undefined) return null;
  return <div className="fila-monto"><span>{titulo}</span><strong>{formatearMonto(monto)}</strong></div>;
}

function Seccion({ titulo, vacio, movimientos, idObra, alAnular, accion }) {
  return (
    <>
      <h2 className="titulo-seccion">{titulo}</h2>
      {accion}
      {movimientos.length === 0 && <p className="texto-secundario">{vacio}</p>}
      {movimientos.map((m) => <TarjetaMovimiento key={m.id} idObra={idObra} movimiento={m} alAnular={alAnular} />)}
    </>
  );
}
