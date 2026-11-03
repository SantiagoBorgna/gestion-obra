import { useEffect, useState } from 'react';

// Pantalla provisoria para verificar que frontend, backend y base de datos se comunican.
export default function Estado() {
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setEstado)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="pantalla-acceso">
      <div className="acceso-marca">
        <div className="acceso-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5b4523" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
          </svg>
        </div>
        <h1>Gestión de Obra</h1>
      </div>
      <div className="tarjeta">
        <h2>Estado del sistema</h2>
        {error && <p className="texto-error">No se pudo conectar con el backend.</p>}
        {!estado && !error && <p className="texto-secundario">Consultando…</p>}
        {estado && (
          <ul className="lista-estado">
            <li>Backend: <strong>{estado.backend}</strong></li>
            <li>Base de datos: <strong>{estado.baseDeDatos}</strong></li>
          </ul>
        )}
      </div>
    </div>
  );
}
