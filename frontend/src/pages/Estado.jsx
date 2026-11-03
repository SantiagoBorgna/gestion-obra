import { useEffect, useState } from 'react';
import PantallaAcceso from '../componentes/PantallaAcceso.jsx';

// Pantalla de diagnóstico para verificar que frontend, backend y base de datos se comunican.
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
    <PantallaAcceso titulo="Estado del sistema">
      {error && <p className="texto-error">No se pudo conectar con el backend.</p>}
      {!estado && !error && <p className="texto-secundario">Consultando…</p>}
      {estado && (
        <ul className="lista-estado">
          <li>Backend: <strong>{estado.backend}</strong></li>
          <li>Base de datos: <strong>{estado.baseDeDatos}</strong></li>
        </ul>
      )}
    </PantallaAcceso>
  );
}
