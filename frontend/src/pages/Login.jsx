import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
    <PantallaAcceso titulo="Iniciar sesión">
      <form onSubmit={enviar} className="formulario">
        <label className="campo">
          <span>Correo electrónico</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label className="campo">
          <span>Contraseña</span>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="texto-error">{error}</p>}
        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <Link to="/recuperar-clave" className="enlace-secundario">¿Olvidaste tu contraseña?</Link>
      </form>
    </PantallaAcceso>
  );
}
