import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import CampoClave from '../componentes/CampoClave.jsx';
import PantallaAcceso from '../componentes/PantallaAcceso.jsx';
import { useSesion } from '../sesion/SesionContext.jsx';

export default function Login() {
  const { usuario, iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/obras" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(email, clave);
      navegar(ubicacion.state?.desde ?? '/obras', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PantallaAcceso pie="¿No tenés cuenta? Pedile la invitación al arquitecto de tu obra.">
      <form onSubmit={enviar} className="formulario">
        <label className="campo">
          <span>Correo electrónico</span>
          <input type="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <CampoClave etiqueta="Contraseña" placeholder="Tu contraseña" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
        {error && <p className="texto-error">{error}</p>}
        <button type="submit" className="boton boton-fuerte" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
        <Link to="/recuperar-clave" className="enlace-secundario">Olvidé mi contraseña</Link>
      </form>
    </PantallaAcceso>
  );
}
