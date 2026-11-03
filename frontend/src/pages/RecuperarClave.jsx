import { useState } from 'react';
import { Link } from 'react-router-dom';
import PantallaAcceso from '../componentes/PantallaAcceso.jsx';
import { api } from '../api.js';

export default function RecuperarClave() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api('/auth/recuperar', { metodo: 'POST', datos: { email } });
      setEnviado(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <PantallaAcceso titulo="Revisá tu correo">
        <p className="texto-secundario">
          Si el correo está registrado, te enviamos un enlace para definir una nueva contraseña. Vence en 1 hora.
        </p>
        <Link to="/login" className="enlace-secundario">Volver a iniciar sesión</Link>
      </PantallaAcceso>
    );
  }

  return (
    <PantallaAcceso titulo="Recuperar contraseña">
      <form onSubmit={enviar} className="formulario">
        <p className="texto-secundario">Ingresá tu correo y te enviamos un enlace para definir una contraseña nueva.</p>
        <label className="campo">
          <span>Correo electrónico</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        {error && <p className="texto-error">{error}</p>}
        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar enlace'}
        </button>
        <Link to="/login" className="enlace-secundario">Volver a iniciar sesión</Link>
      </form>
    </PantallaAcceso>
  );
}
