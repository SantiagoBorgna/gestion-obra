import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import {
  IconoAlerta, IconoBandera, IconoBarras, IconoBilletes, IconoChevron, IconoDocumento,
  IconoEscalones, IconoLibro, IconoLista, IconoPersonas, IconoRecibo,
} from '../componentes/Iconos.jsx';
import { api } from '../api.js';
import { ESTADOS_OBRA, ESTADOS_PRESUPUESTO, formatearMonto, formatearPorcentaje } from '../constantes.js';
import { useSesion } from '../sesion/SesionContext.jsx';

// Inicio de la obra: un menú cuyas opciones dependen del rol. Etapas, Bitácora y Finalizar
// todavía no entran en la demo, así que figuran apagadas.
export default function DetalleObra() {
  const { idObra } = useParams();
  const { usuario } = useSesion();
  const [obra, setObra] = useState(null);
  const [datos, setDatos] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      const detalle = await api(`/obras/${idObra}`);
      const presupuesto = await api(`/obras/${idObra}/presupuesto`);
      const aprobado = presupuesto?.estado === 'APROBADO';
      const pagos = aprobado ? await api(`/obras/${idObra}/pagos`) : null;
      const [alertas, comparacion] = detalle.esArquitecto && aprobado
        ? await Promise.all([api(`/obras/${idObra}/alertas`), api(`/obras/${idObra}/comparacion`)])
        : [null, null];
      setObra(detalle);
      setDatos({ presupuesto, aprobado, pagos, alertas, comparacion });
    }
    cargar().catch((e) => setError(e.message));
  }, [idObra]);

  const { presupuesto, aprobado, pagos, alertas, comparacion } = datos;
  const esArquitecto = obra?.esArquitecto;
  const esCliente = usuario.rol === 'CLIENTE';
  const activas = alertas?.activas.length ?? 0;
  const ruta = (sufijo) => `/obras/${idObra}/${sufijo}`;

  return (
    <div className="pantalla">
      <BarraSuperior titulo="Mis obras" volverA="/obras" />
      <main className="contenido">
        {error && <p className="texto-error">{error}</p>}
        {obra && (
          <>
            <div className="cabecera-pantalla">
              <h1 className="titulo-pantalla">{obra.titulo}</h1>
              <span className="estado-obra"><span className="marcador" />{ESTADOS_OBRA[obra.estado]}</span>
            </div>
            {obra.cliente && <span className="texto-suave">Cliente: {obra.cliente}</span>}

            {activas > 0 && (
              <Link to={ruta('alertas')} className="aviso-alertas">
                <IconoAlerta />
                <span>{activas === 1 ? '1 alerta de desvío activa' : `${activas} alertas de desvío activas`}</span>
                <IconoChevron />
              </Link>
            )}

            <h2 className="titulo-seccion seccion">Presupuesto</h2>
            <div className="menu-grupo">
              {esArquitecto && <FilaMenu icono={<IconoLista />} titulo="Relevamiento" a={ruta('relevamiento')} />}
              <FilaMenu
                icono={<IconoDocumento />}
                titulo={esArquitecto || esCliente ? 'Presupuesto' : 'Estimación de costos'}
                a={presupuesto ? ruta('presupuesto') : null}
                valor={presupuesto && (esArquitecto || esCliente) ? ESTADOS_PRESUPUESTO[presupuesto.estado] : null}
                claseValor={aprobado ? 'texto-verde' : ''}
              />
            </div>

            <h2 className="titulo-seccion seccion">Ejecución</h2>
            <div className="menu-grupo">
              {esArquitecto && <FilaMenu icono={<IconoEscalones />} titulo="Etapas" />}
              <FilaMenu icono={<IconoLibro />} titulo="Bitácora" />
              {esArquitecto && (
                <FilaMenu icono={<IconoPersonas />} titulo="Participantes" a={ruta('participantes')} valor={obra.participantes.length} />
              )}
            </div>

            <h2 className="titulo-seccion seccion">Finanzas</h2>
            <div className="menu-grupo">
              {(esArquitecto || esCliente) && (
                <FilaMenu
                  icono={<IconoBilletes />}
                  titulo={esArquitecto ? 'Cobros al cliente' : 'Mis pagos'}
                  a={aprobado ? ruta('cobros') : null}
                  valor={pagos ? formatearMonto(pagos.resumen.totalCobrado) : null}
                />
              )}
              {!esCliente && (
                <FilaMenu
                  icono={<IconoRecibo />}
                  titulo={esArquitecto ? 'Pagos a colaboradores' : 'Pagos recibidos'}
                  a={aprobado ? ruta('pagos') : null}
                  valor={pagos ? formatearMonto(pagos.resumen.totalPagado) : null}
                />
              )}
              {esArquitecto && (
                <FilaMenu
                  icono={<IconoBarras />}
                  titulo="Presupuesto y gasto"
                  a={aprobado ? ruta('comparacion') : null}
                  valor={comparacion ? formatearPorcentaje(comparacion.totales.porcentaje, true) : null}
                  claseValor={comparacion && Number(comparacion.totales.diferencia) > 0 ? 'texto-ambar' : 'texto-verde'}
                />
              )}
              {esArquitecto && <FilaMenu icono={<IconoBandera />} titulo="Finalizar obra" />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function FilaMenu({ icono, titulo, a, valor, claseValor = '' }) {
  const contenido = (
    <>
      <span className="menu-icono">{icono}</span>
      <span className="menu-titulo">{titulo}</span>
      {valor !== null && valor !== undefined && <span className={`menu-valor ${claseValor}`}>{valor}</span>}
      <span className="chevron"><IconoChevron /></span>
    </>
  );
  if (!a) return <div className="menu-fila menu-fila-apagada">{contenido}</div>;
  return <Link to={a} className="menu-fila">{contenido}</Link>;
}
