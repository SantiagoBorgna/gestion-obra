import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import DialogoConfirmacion from '../componentes/DialogoConfirmacion.jsx';
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
    <button type="button" className="barra-volver" onClick={abrirUmbral} aria-label="Configurar umbral">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
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
            <span className="texto-suave">Umbral configurado: {formatearPorcentaje(datos.umbral)}</span>
            <h2 className="titulo-seccion">
              {activas.length === 1 ? '1 alerta activa' : `${activas.length} alertas activas`}
            </h2>
            {activas.length === 0 && <p className="texto-secundario">No hay desvíos para revisar.</p>}
            <GrupoAlertas titulo="Desvío alto" clase="texto-error" alertas={altas} alResolver={setAResolver} />
            <GrupoAlertas titulo="Desvío moderado" clase="texto-ambar" alertas={moderadas} alResolver={setAResolver} />

            {datos.resueltas.length > 0 && <h2 className="titulo-seccion">Resueltas</h2>}
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
      <strong className={clase}>{titulo}</strong>
      {alertas.map((alerta) => {
        const maximo = Math.max(alerta.presupuestado, alerta.gastoReal);
        return (
          <div key={alerta.id} className="tarjeta">
            <div className="tarjeta-fila">
              <strong>{nombreAlerta(alerta)}</strong>
              <strong className={COLOR_NIVEL[alerta.nivel]}>{formatearPorcentaje(alerta.porcentaje, true)}</strong>
            </div>
            <FilaBarra titulo="Presupuestado" monto={alerta.presupuestado} maximo={maximo} />
            <FilaBarra titulo="Gastado real" monto={alerta.gastoReal} maximo={maximo} nivel={alerta.nivel} />
            <div className="tarjeta-fila">
              <span className="texto-suave">{formatearFecha(alerta.fecha)}</span>
              <button type="button" className="boton-texto texto-verde" onClick={() => alResolver(alerta)}>Marcar como resuelta</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
