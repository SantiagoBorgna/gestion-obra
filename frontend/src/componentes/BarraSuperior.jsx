import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DialogoConfirmacion from './DialogoConfirmacion.jsx';
import { IconoPerfil, IconoVolver } from './Iconos.jsx';
import { ROLES } from '../constantes.js';
import { useSesion } from '../sesion/SesionContext.jsx';

// Barra beige de las pantallas internas: flecha de volver (opcional), título, acción y perfil.
export default function BarraSuperior({ titulo, volverA, accion }) {
  const navegar = useNavigate();
  return (
    <header className="barra-superior">
      {volverA && (
        <button type="button" className="barra-icono" onClick={() => navegar(volverA)} aria-label="Volver">
          <IconoVolver />
        </button>
      )}
      <h1 className={`barra-titulo ${volverA ? '' : 'barra-titulo-sola'}`}>{titulo}</h1>
      {accion}
      <MenuPerfil />
    </header>
  );
}

function MenuPerfil() {
  const { usuario, cerrarSesion } = useSesion();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const contenedor = useRef(null);

  const cancelarSalida = useCallback(() => setConfirmando(false), []);

  useEffect(() => {
    if (!abierto) return undefined;
    function alTocarAfuera(evento) {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', alTocarAfuera);
    return () => document.removeEventListener('mousedown', alTocarAfuera);
  }, [abierto]);

  async function salir() {
    await cerrarSesion();
    navegar('/login', { replace: true });
  }

  return (
    <div className="perfil" ref={contenedor}>
      <button type="button" className="perfil-boton" onClick={() => setAbierto(!abierto)} aria-label="Perfil" aria-expanded={abierto}>
        <IconoPerfil />
      </button>
      {abierto && usuario && (
        <div className="menu-flotante perfil-menu">
          <strong>{usuario.nombreCompleto}</strong>
          <span className="texto-suave">{ROLES[usuario.rol]}</span>
          <button type="button" className="menu-flotante-opcion" onClick={() => { setAbierto(false); setConfirmando(true); }}>Salir</button>
        </div>
      )}
      {confirmando && (
        <DialogoConfirmacion
          titulo="Salir"
          mensaje="¿Seguro que querés salir? Vas a tener que volver a iniciar sesión."
          textoConfirmar="Salir"
          alConfirmar={salir}
          alCancelar={cancelarSalida}
        />
      )}
    </div>
  );
}
