import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import { api } from '../api.js';
import { ESTADOS_OBRA, ROLES, formatearFecha } from '../constantes.js';
import { useSesion } from '../sesion/SesionContext.jsx';

export default function MisObras() {
  const { usuario, cerrarSesion } = useSesion();
  const navegar = useNavigate();
  const [obras, setObras] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/obras').then(setObras).catch((e) => setError(e.message));
  }, []);

  async function salir() {
    await cerrarSesion();
    navegar('/login', { replace: true });
  }

  const esArquitecto = usuario.rol === 'ARQUITECTO';

  return (
    <div className="pantalla">
      <BarraSuperior titulo="Mis obras" accion={<button type="button" className="boton-texto" onClick={salir}>Salir</button>} />
      <main className="contenido">
        <p className="texto-secundario saludo">{usuario.nombreCompleto} · {ROLES[usuario.rol]}</p>

        {esArquitecto && <Link to="/obras/nueva" className="boton boton-primario">+ Nueva obra</Link>}

        <h2 className="titulo-seccion">Obras</h2>
        {error && <p className="texto-error">{error}</p>}
        {obras && obras.length === 0 && (
          <p className="texto-secundario">
            {esArquitecto ? 'Todavía no cargaste ninguna obra.' : 'Todavía no participás de ninguna obra.'}
          </p>
        )}
        {obras?.map((obra) => (
          <Link key={obra.id} to={`/obras/${obra.id}`} className="tarjeta tarjeta-enlace">
            <div className="tarjeta-fila">
              <strong>{obra.titulo}</strong>
              <span className={`etiqueta ${obra.estado === 'EN_CURSO' ? 'etiqueta-verde' : ''}`}>{ESTADOS_OBRA[obra.estado]}</span>
            </div>
            <span className="texto-secundario">{obra.ubicacion}</span>
            <span className="texto-suave">Cliente: {obra.cliente} · Inicio: {formatearFecha(obra.fechaInicio)}</span>
          </Link>
        ))}
      </main>
    </div>
  );
}
