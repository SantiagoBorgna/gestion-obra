import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import DialogoConfirmacion from '../componentes/DialogoConfirmacion.jsx';
import SelectorRubro from '../componentes/SelectorRubro.jsx';
import { api } from '../api.js';
import { ROLES, RUBROS } from '../constantes.js';

const PARTICIPANTE_VACIO = { nombreCompleto: '', email: '', rol: 'ESPECIALISTA', rubro: '' };
const GRUPOS = ['CLIENTE', 'CUADRILLA', 'ESPECIALISTA'];

// Participantes de la obra, agrupados por rol. Solo los ve el arquitecto.
export default function Participantes() {
  const { idObra } = useParams();
  const [obra, setObra] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [aReenviar, setAReenviar] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api(`/obras/${idObra}`).then(setObra).catch((e) => setError(e.message));
  }, [idObra]);

  const cancelarReenvio = useCallback(() => setAReenviar(null), []);

  async function reenviar() {
    const participante = aReenviar;
    setAviso('');
    setEnviando(true);
    try {
      await api(`/obras/${idObra}/participantes/${participante.id}/reenviar-invitacion`, { metodo: 'POST' });
      setAviso(`Se envió una invitación nueva a ${participante.email}. El enlace anterior ya no es válido.`);
    } catch (e) {
      setAviso(e.message);
    } finally {
      setEnviando(false);
      setAReenviar(null);
    }
  }

  function agregado(participante) {
    setObra({ ...obra, participantes: [...obra.participantes, participante] });
    setAgregando(false);
    setAviso(participante.invitacionPendiente
      ? `Se agregó a ${participante.nombreCompleto} y se le envió la invitación.`
      : `Se agregó a ${participante.nombreCompleto}. Ya tenía cuenta, así que puede ingresar directamente.`);
  }

  const participantes = obra?.participantes ?? [];

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? 'Participantes'} volverA={`/obras/${idObra}`} />
      <main className="contenido">
        <div className="cabecera-pantalla">
          <h1 className="titulo-pantalla">Participantes</h1>
          {obra?.esArquitecto && !agregando && (
            <button type="button" className="boton boton-chico" onClick={() => setAgregando(true)}>+ Agregar</button>
          )}
        </div>
        {error && <p className="texto-error">{error}</p>}
        {aviso && <p className="aviso">{aviso}</p>}
        {agregando && (
          <FormularioParticipante idObra={idObra} alAgregar={agregado} alCancelar={() => setAgregando(false)} />
        )}
        {obra && (
          <h2 className="titulo-seccion seccion">
            {participantes.length === 1 ? '1 participante' : `${participantes.length} participantes`}
          </h2>
        )}
        {GRUPOS.map((rol) => {
          const delGrupo = participantes.filter((p) => p.rol === rol);
          if (delGrupo.length === 0) return null;
          return (
            <section key={rol} className="seccion">
              <h3 className="grupo-titulo"><span className="marcador" />{ROLES[rol]}</h3>
              {delGrupo.map((p) => (
                <div key={`${p.id}-${p.rubro}`} className="tarjeta">
                  <div className="tarjeta-fila">
                    <span className="tarjeta-titulo">{p.nombreCompleto}</span>
                    <span className={`fila-participante-estado ${p.invitacionPendiente ? 'texto-ambar' : 'texto-verde'}`}>
                      {p.invitacionPendiente ? 'Invitación pendiente' : 'Activo'}
                    </span>
                  </div>
                  <div className="etapa-participante">
                    <span>{[RUBROS[p.rubro], p.email].filter(Boolean).join(' · ')}</span>
                    {p.invitacionPendiente && (
                      <button type="button" className="enlace" onClick={() => setAReenviar(p)}>Reenviar</button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </main>
      {aReenviar && (
        <DialogoConfirmacion
          titulo="Reenviar invitación"
          mensaje={`El enlace actual de ${aReenviar.email} se va a invalidar. ¿Seguro que querés reenviar la invitación?`}
          textoConfirmar="Reenviar"
          enviando={enviando}
          alConfirmar={reenviar}
          alCancelar={cancelarReenvio}
        />
      )}
    </div>
  );
}

function FormularioParticipante({ idObra, alAgregar, alCancelar }) {
  const [datos, setDatos] = useState(PARTICIPANTE_VACIO);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      alAgregar(await api(`/obras/${idObra}/participantes`, { metodo: 'POST', datos }));
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="tarjeta formulario">
      <label className="campo">
        <span>Correo electrónico</span>
        <input type="email" placeholder="nombre@correo.com" value={datos.email} onChange={cambiar('email')} required />
      </label>
      <label className="campo">
        <span>Nombre completo</span>
        <input placeholder="Nombre y apellido" value={datos.nombreCompleto} onChange={cambiar('nombreCompleto')} maxLength={120} required />
      </label>
      <label className="campo">
        <span>Rol</span>
        <select value={datos.rol} onChange={cambiar('rol')}>
          <option value="ESPECIALISTA">{ROLES.ESPECIALISTA}</option>
          <option value="CUADRILLA">{ROLES.CUADRILLA}</option>
        </select>
      </label>
      <SelectorRubro valor={datos.rubro} alCambiar={(rubro) => setDatos({ ...datos, rubro })} />
      {error && <p className="texto-error">{error}</p>}
      <div className="form-en-linea">
        <button type="button" className="boton" onClick={alCancelar}>Cancelar</button>
        <button type="submit" className="boton boton-fuerte" disabled={enviando}>{enviando ? 'Agregando…' : 'Agregar'}</button>
      </div>
    </form>
  );
}
