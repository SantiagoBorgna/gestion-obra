import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import DialogoConfirmacion from '../componentes/DialogoConfirmacion.jsx';
import { IconoEngranaje } from '../componentes/Iconos.jsx';
import { FilaBarra } from './Comparacion.jsx';
import { api } from '../api.js';
import { COLOR_NIVEL, RUBROS, formatearFecha, formatearMonto, formatearPorcentaje } from '../constantes.js';

// Alertas de desvío (HU-12). El umbral se configura desde el engranaje de la barra.
export default function Alertas() {
  const { idObra } = useParams();
  const [obra, setObra] = useState(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [aResolver, setAResolver] = useState(null);
  const [editandoUmbral, setEditandoUmbral] = useState(false);
  const [umbral, setUmbral] = useState('');
  const [errorDialogo, setErrorDialogo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([api(`/obras/${idObra}`).then(setObra), api(`/obras/${idObra}/alertas`).then(setDatos)])
      .catch((e) => setError(e.message));
  }, [idObra]);

  const cerrarDialogos = useCallback(() => {
    setAResolver(null);
    setEditandoUmbral(false);
    setErrorDialogo('');
  }, []);

  async function ejecutar(ruta, opciones) {
    setErrorDialogo('');
    setEnviando(true);
    try {
      setDatos(await api(`/obras/${idObra}/alertas${ruta}`, opciones));
      cerrarDialogos();
    } catch (e) {
      setErrorDialogo(e.message);
    } finally {
      setEnviando(false);
    }
  }

  function abrirUmbral() {
    setUmbral(datos.umbral);
    setEditandoUmbral(true);
  }

  const engranaje = datos?.habilitado && (
    <button type="button" className="barra-icono" onClick={abrirUmbral} aria-label="Configurar umbral">
      <IconoEngranaje />
    </button>
  );

  const activas = datos?.activas ?? [];
  const altas = activas.filter((a) => a.nivel === 'ALTO');
  const moderadas = activas.filter((a) => a.nivel !== 'ALTO');

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? 'Alertas'} volverA={`/obras/${idObra}`} accion={engranaje} />
      <main className="contenido">
        <h1 className="titulo-pantalla">Alertas</h1>
        <p className="texto-secundario">Te avisamos cuando el gasto real se aleja de lo presupuestado.</p>
        {error && <p className="texto-error">{error}</p>}
        {datos && !datos.habilitado && (
          <p className="texto-secundario">Las alertas se habilitan cuando el cliente aprueba el presupuesto.</p>
        )}
        {datos?.habilitado && (
          <>
            <h2 className="titulo-seccion seccion">
              {activas.length === 1 ? '1 alerta activa' : `${activas.length} alertas activas`}
            </h2>
            {activas.length === 0 && <p className="texto-secundario">No hay desvíos para revisar.</p>}
            <GrupoAlertas titulo="Desvío alto" clase="grupo-rojo" alertas={altas} alResolver={setAResolver} />
            <GrupoAlertas titulo="Desvío moderado" clase="grupo-ambar" alertas={moderadas} alResolver={setAResolver} />

            {datos.resueltas.length > 0 && <h2 className="titulo-seccion seccion">Resueltas</h2>}
            {datos.resueltas.map((alerta) => (
              <div key={alerta.id} className="tarjeta">
                <strong>{nombreAlerta(alerta)}</strong>
                <span className="texto-secundario">{alerta.mensaje}</span>
                <span className="texto-suave">
                  Resuelta el {formatearFecha(alerta.fechaResolucion)} con un gasto de {formatearMonto(alerta.gastoRealResolucion)}
                </span>
              </div>
            ))}
          </>
        )}
      </main>

      {aResolver && (
        <DialogoConfirmacion
          titulo="Marcar como resuelta"
          mensaje={`La alerta de ${nombreAlerta(aResolver)} sale de las activas. Solo se genera otra si el gasto real supera ${formatearMonto(aResolver.gastoReal)}.`}
          textoConfirmar="Resolver"
          enviando={enviando}
          alConfirmar={() => ejecutar(`/${aResolver.id}/resolver`, { metodo: 'POST' })}
          alCancelar={cerrarDialogos}
        >
          {errorDialogo && <p className="texto-error">{errorDialogo}</p>}
        </DialogoConfirmacion>
      )}

      {editandoUmbral && (
        <DialogoConfirmacion
          titulo="Umbral de alerta"
          mensaje="Se genera una alerta cuando el gasto supera lo presupuestado en este porcentaje. El nuevo valor se aplica en el momento."
          textoConfirmar="Guardar"
          enviando={enviando}
          deshabilitado={umbral === ''}
          alConfirmar={() => ejecutar('/umbral', { metodo: 'PUT', datos: { umbral } })}
          alCancelar={cerrarDialogos}
        >
          <label className="campo">
            <span>Umbral (%)</span>
            <input type="number" min="0.01" max="999.99" step="0.01" value={umbral} onChange={(e) => setUmbral(e.target.value)} />
          </label>
          {errorDialogo && <p className="texto-error">{errorDialogo}</p>}
        </DialogoConfirmacion>
      )}
    </div>
  );
}

function nombreAlerta(alerta) {
  return alerta.rubro ? RUBROS[alerta.rubro] : 'General';
}

function GrupoAlertas({ titulo, clase, alertas, alResolver }) {
  if (alertas.length === 0) return null;
  return (
    <>
      <h3 className={`grupo-titulo ${clase}`}><span className="marcador" />{titulo}</h3>
      {alertas.map((alerta) => {
        const maximo = Math.max(alerta.presupuestado, alerta.gastoReal);
        return (
          <div key={alerta.id} className="tarjeta">
            <div className="tarjeta-fila">
              <span className="tarjeta-titulo">{nombreAlerta(alerta)}</span>
              <strong className={COLOR_NIVEL[alerta.nivel]}>{formatearPorcentaje(alerta.porcentaje, true)}</strong>
            </div>
            <FilaBarra titulo="Presupuestado" monto={alerta.presupuestado} maximo={maximo} />
            <FilaBarra titulo="Gastado real" monto={alerta.gastoReal} maximo={maximo} nivel={alerta.nivel} destacar />
            <div className="tarjeta-fila">
              <span className="texto-suave">{formatearFecha(alerta.fecha)}</span>
              <button type="button" className="accion-texto accion-verde" onClick={() => alResolver(alerta)}>Marcar como resuelta</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
