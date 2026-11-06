import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import { IconoChevron } from '../componentes/Iconos.jsx';
import { api } from '../api.js';
import { useSesion } from '../sesion/SesionContext.jsx';

// En qué punto está la obra, según quién la mira. Reemplaza a la barra de etapas, que todavía no entra en la demo.
function textoSituacion(presupuesto, rol) {
  if (rol === 'CLIENTE') {
    if (!presupuesto) return 'Presupuesto en preparación';
    return { PRESENTADO: 'Presupuesto para revisar', APROBADO: 'Presupuesto aprobado', RECHAZADO: 'Presupuesto rechazado' }[presupuesto.estado];
  }
  if (rol !== 'ARQUITECTO') {
    if (!presupuesto) return 'Todavía no se solicitaron los costos';
    return presupuesto.estado === 'EN_ESTIMACION' ? 'Costos por cargar' : 'Estimación cerrada';
  }
  if (!presupuesto) return 'En relevamiento';
  if (presupuesto.estado === 'EN_ESTIMACION') {
    const rubros = presupuesto.items.filter((i) => i.tipo === 'RUBRO');
    const cargados = rubros.filter((i) => i.estado !== 'SIN_CARGAR').length;
    return `${cargados} de ${rubros.length} rubros con costo cargado`;
  }
  return {
    CONSOLIDADO: 'Presupuesto consolidado',
    PRESENTADO: 'Esperando aprobación del cliente',
    APROBADO: 'Presupuesto aprobado',
    RECHAZADO: 'Presupuesto rechazado por el cliente',
  }[presupuesto.estado];
}

export default function MisObras() {
  const { usuario } = useSesion();
  const [obras, setObras] = useState(null);
  const [error, setError] = useState('');
  const esArquitecto = usuario.rol === 'ARQUITECTO';

  useEffect(() => {
    async function cargar() {
      const lista = await api('/obras');
      const completas = await Promise.all(lista.map(async (obra) => {
        const presupuesto = await api(`/obras/${obra.id}/presupuesto`);
        const alertas = esArquitecto && presupuesto?.estado === 'APROBADO'
          ? (await api(`/obras/${obra.id}/alertas`)).activas.length
          : 0;
        return { ...obra, situacion: textoSituacion(presupuesto, usuario.rol), alertas };
      }));
      setObras(completas);
    }
    cargar().catch((e) => setError(e.message));
  }, [esArquitecto, usuario.rol]);

  const enCurso = obras?.filter((o) => o.estado === 'EN_CURSO') ?? [];
  const finalizadas = obras?.filter((o) => o.estado !== 'EN_CURSO') ?? [];

  return (
    <div className="pantalla">
      <BarraSuperior titulo="Gestión de Obra" />
      <main className="contenido">
        <div className="cabecera-pantalla">
          <h1 className="titulo-pantalla">Mis obras</h1>
          {esArquitecto && <Link to="/obras/nueva" className="boton boton-chico">+ Nueva obra</Link>}
        </div>

        {error && <p className="texto-error">{error}</p>}
        {obras && (
          <h2 className="titulo-seccion seccion">{obras.length === 1 ? '1 obra' : `${obras.length} obras`}</h2>
        )}
        {obras?.length === 0 && (
          <p className="texto-secundario">
            {esArquitecto ? 'Todavía no cargaste ninguna obra.' : 'Todavía no participás de ninguna obra.'}
          </p>
        )}
        <GrupoObras titulo="En curso" clase="grupo-verde" obras={enCurso} />
        <GrupoObras titulo="Finalizadas" clase="grupo-gris" obras={finalizadas} apagada />
      </main>
    </div>
  );
}

function GrupoObras({ titulo, clase, obras, apagada }) {
  if (obras.length === 0) return null;
  return (
    <>
      <h3 className={`grupo-titulo ${clase}`}><span className="marcador" />{titulo}</h3>
      {obras.map((obra) => (
        <Link key={obra.id} to={`/obras/${obra.id}`} className={`tarjeta tarjeta-enlace ${apagada ? 'tarjeta-apagada' : ''}`}>
          <div className="tarjeta-fila">
            <span className="tarjeta-titulo">{obra.titulo}</span>
            {obra.alertas > 0 ? (
              <span className="alerta-tarjeta">{obra.alertas === 1 ? '1 alerta activa' : `${obra.alertas} alertas activas`}</span>
            ) : (
              <span className="chevron"><IconoChevron /></span>
            )}
          </div>
          {obra.cliente && <span className="texto-suave">Cliente: {obra.cliente}</span>}
          <span className="texto-secundario">{obra.situacion}</span>
        </Link>
      ))}
    </>
  );
}
