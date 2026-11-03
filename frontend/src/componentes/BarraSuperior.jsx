import { useNavigate } from 'react-router-dom';

// Barra beige de las pantallas internas: flecha de volver (opcional), título y acción a la derecha.
export default function BarraSuperior({ titulo, volverA, accion }) {
  const navegar = useNavigate();
  return (
    <header className="barra-superior">
      {volverA ? (
        <button type="button" className="barra-volver" onClick={() => navegar(volverA)} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      ) : (
        <span className="barra-volver-espacio" />
      )}
      <h1 className="barra-titulo">{titulo}</h1>
      <div className="barra-accion">{accion}</div>
    </header>
  );
}
