import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../api.js';

const SesionContext = createContext(null);

// Mantiene el usuario logueado. Al cargar la página consulta /auth/yo para saber si
// la cookie de sesión sigue vigente.
export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api('/auth/yo')
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const iniciarSesion = useCallback(async (email, clave) => {
    const datos = await api('/auth/login', { metodo: 'POST', datos: { email, clave } });
    setUsuario(datos);
    return datos;
  }, []);

  const cerrarSesion = useCallback(async () => {
    await api('/auth/logout', { metodo: 'POST' }).catch(() => {});
    setUsuario(null);
  }, []);

  return (
    <SesionContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  return useContext(SesionContext);
}

// Envuelve las pantallas que requieren sesión; si no hay, manda al inicio de sesión.
export function RutaPrivada({ children }) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  return children;
}
