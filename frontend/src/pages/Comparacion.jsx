import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import { api } from '../api.js';
import { COLOR_NIVEL, RUBROS, formatearDiferencia, formatearMonto } from '../constantes.js';

// Presupuesto y gasto (HU-11): solo para el arquitecto, rubro por rubro.
export default function Comparacion() {
  const { idObra } = useParams();
  const [obra, setObra] = useState(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api(`/obras/${idObra}`).then(setObra), api(`/obras/${idObra}/comparacion`).then(setDatos)])
      .catch((e) => setError(e.message));
  }, [idObra]);

  const totales = datos?.totales;

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? 'Presupuesto y gasto'} volverA={`/obras/${idObra}`} />
      <main className="contenido">
        <h1 className="titulo-pantalla">Presupuesto y gasto</h1>
        {error && <p className="texto-error">{error}</p>}
        {datos && !datos.habilitado && (
          <p className="texto-secundario">Todavía no hay un presupuesto aprobado contra el cual comparar.</p>
        )}
        {datos?.habilitado && (
          <>
            <div className="fila-tarjetas">
              <div className="tarjeta">
                <span className="texto-suave">Presupuestado</span>
                <strong>{formatearMonto(totales.presupuestado)}</strong>
              </div>
              <div className="tarjeta">
                <span className="texto-suave">Gastado real</span>
                <strong>{formatearMonto(totales.gastoReal)}</strong>
              </div>
            </div>
            <div className="aviso tarjeta-fila">
              <span>Diferencia total</span>
              <strong>{formatearDiferencia(totales)}</strong>
            </div>

            <h2 className="titulo-seccion">Detalle por rubro</h2>
            {datos.rubros.map((fila) => {
              const maximo = Math.max(fila.presupuestado, fila.gastoReal);
              return (
                <div key={fila.idItem} className="tarjeta">
                  <div className="tarjeta-fila">
                    <strong>{RUBROS[fila.rubro]}</strong>
                    <strong className={COLOR_NIVEL[fila.nivel]}>{formatearDiferencia(fila)}</strong>
                  </div>
                  <FilaBarra titulo="Presup." monto={fila.presupuestado} maximo={maximo} />
                  <FilaBarra titulo="Gastado" monto={fila.gastoReal} maximo={maximo} nivel={fila.nivel} />
                </div>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}

export function FilaBarra({ titulo, monto, maximo, nivel }) {
  const ancho = maximo > 0 ? (monto / maximo) * 100 : 0;
  return (
    <div className="fila-barra">
      <span className="texto-suave">{titulo}</span>
      <div className="barra"><div className={`barra-relleno ${nivel ? `barra-${nivel}` : ''}`} style={{ width: `${ancho}%` }} /></div>
      <span>{formatearMonto(monto)}</span>
    </div>
  );
}
