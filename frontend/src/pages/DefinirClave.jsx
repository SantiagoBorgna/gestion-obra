import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CampoClave from '../componentes/CampoClave.jsx';
import PantallaAcceso from '../componentes/PantallaAcceso.jsx';
import { api } from '../api.js';

const LARGO_MINIMO = 15;
const LARGO_MAXIMO = 64;
const ESPERA_REVISION = 400;

// Pantalla a la que llevan los enlaces de invitación y de recuperación de contraseña.
export default function DefinirClave() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') ?? '';
  const obra = parametros.get('obra');
  const [persona, setPersona] = useState(null);
  const [errorEnlace, setErrorEnlace] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [revision, setRevision] = useState(null);
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
  const largoValido = largo >= LARGO_MINIMO && largo <= LARGO_MAXIMO;
  const coinciden = clave !== '' && clave === confirmacion;

  // Con el largo correcto, le pregunta al servidor si la contraseña se puede usar, cuando se deja de escribir.
  useEffect(() => {
    setRevision(null);
    if (!largoValido) return undefined;
    let vigente = true;
    const espera = setTimeout(() => {
      api(`/invitaciones/${encodeURIComponent(token)}/revisar-clave`, { metodo: 'POST', datos: { clave } })
        .then((resultado) => { if (vigente) setRevision(resultado); })
        .catch((e) => { if (vigente) setRevision({ valida: false, motivo: e.message }); });
    }, ESPERA_REVISION);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [clave, largoValido, token]);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
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
        <Link to="/login" className="boton boton-fuerte">Iniciar sesión</Link>
      </PantallaAcceso>
    );
  }

  if (!persona) return <PantallaAcceso><p className="texto-secundario">Verificando el enlace…</p></PantallaAcceso>;

  const nombre = persona.nombreCompleto.split(' ')[0];

  return (
    <PantallaAcceso titulo={obra ? 'Creá tu contraseña' : 'Definí tu nueva contraseña'}>
      <form onSubmit={enviar} className="formulario">
        <p className="texto-secundario">
          {obra ? `Hola, ${nombre}. Fuiste invitado a ${obra}.` : `Hola, ${nombre}. Elegí una contraseña nueva para tu cuenta.`}
        </p>
        <CampoClave etiqueta="Nueva contraseña" placeholder="Tu contraseña" value={clave}
                    onChange={(e) => setClave(e.target.value)} autoComplete="new-password" required />
        <CampoClave etiqueta="Repetir contraseña" placeholder="Repetí tu contraseña" conOjo={false} value={confirmacion}
                    onChange={(e) => setConfirmacion(e.target.value)} autoComplete="new-password" required />
        <ul className="lista-requisitos">
          <Requisito cumplido={largoValido}>Entre {LARGO_MINIMO} y {LARGO_MAXIMO} caracteres</Requisito>
          <Requisito cumplido={revision?.valida} rechazado={revision && !revision.valida}>
            {revision?.motivo ?? 'No es una contraseña común o filtrada'}
          </Requisito>
          <Requisito cumplido={coinciden}>Las dos contraseñas coinciden</Requisito>
        </ul>
        {error && <p className="texto-error">{error}</p>}
        <button type="submit" className="boton boton-fuerte" disabled={enviando || !largoValido || !revision?.valida || !coinciden}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </PantallaAcceso>
  );
}

function Requisito({ cumplido, rechazado, children }) {
  return (
    <li className={cumplido ? 'requisito-ok' : rechazado ? 'requisito-rechazado' : ''}>
      <span className="requisito-marca" />
      <span>{children}</span>
    </li>
  );
}
