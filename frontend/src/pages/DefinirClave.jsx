import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PantallaAcceso from '../componentes/PantallaAcceso.jsx';
import { api } from '../api.js';

const LARGO_MINIMO = 15;
const LARGO_MAXIMO = 64;

// Pantalla a la que llevan los enlaces de invitación y de recuperación de contraseña.
export default function DefinirClave() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') ?? '';
  const [persona, setPersona] = useState(null);
  const [errorEnlace, setErrorEnlace] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorEnlace('El enlace no es válido.');
      return;
    }
    api(`/invitaciones/${encodeURIComponent(token)}`)
      .then(setPersona)
      .catch((e) => setErrorEnlace(e.message));
  }, [token]);

  const largo = [...clave].length;

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    if (clave !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      await api(`/invitaciones/${encodeURIComponent(token)}`, { metodo: 'POST', datos: { clave } });
      setListo(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (errorEnlace) {
    return (
      <PantallaAcceso titulo="Enlace no válido">
        <p className="texto-error">{errorEnlace}</p>
        <Link to="/recuperar-clave" className="enlace-secundario">Pedir un enlace nuevo</Link>
      </PantallaAcceso>
    );
  }

  if (listo) {
    return (
      <PantallaAcceso titulo="Contraseña guardada">
        <p className="texto-secundario">Ya podés iniciar sesión con tu correo y la contraseña nueva.</p>
        <Link to="/login" className="boton boton-primario">Iniciar sesión</Link>
      </PantallaAcceso>
    );
  }

  if (!persona) return <PantallaAcceso><p className="texto-secundario">Verificando el enlace…</p></PantallaAcceso>;

  return (
    <PantallaAcceso titulo="Definí tu contraseña">
      <form onSubmit={enviar} className="formulario">
        <p className="texto-secundario">
          Hola, {persona.nombreCompleto}. Vas a ingresar con <strong>{persona.email}</strong>.
        </p>
        <label className="campo">
          <span>Contraseña nueva</span>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)}
                 autoComplete="new-password" maxLength={LARGO_MAXIMO * 2} required />
          <small className={largo > 0 && (largo < LARGO_MINIMO || largo > LARGO_MAXIMO) ? 'texto-error' : 'texto-suave'}>
            Entre {LARGO_MINIMO} y {LARGO_MAXIMO} caracteres ({largo}). Podés usar una frase que te resulte fácil de recordar.
          </small>
        </label>
        <label className="campo">
          <span>Repetí la contraseña</span>
          <input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)}
                 autoComplete="new-password" required />
        </label>
        {error && <p className="texto-error">{error}</p>}
        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </PantallaAcceso>
  );
}
