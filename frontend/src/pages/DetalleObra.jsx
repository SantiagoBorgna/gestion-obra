import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import { api } from '../api.js';
import { ESTADOS_OBRA, ROLES, RUBROS, formatearFecha } from '../constantes.js';

const PARTICIPANTE_VACIO = { nombreCompleto: '', email: '', rol: 'ESPECIALISTA', rubro: '' };

export default function DetalleObra() {
  const { idObra } = useParams();
  const [obra, setObra] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    api(`/obras/${idObra}`).then(setObra).catch((e) => setError(e.message));
  }, [idObra]);

  async function reenviar(participante) {
    setAviso('');
    try {
      await api(`/obras/${idObra}/participantes/${participante.id}/reenviar-invitacion`, { metodo: 'POST' });
      setAviso(`Se envió una invitación nueva a ${participante.email}. El enlace anterior ya no sirve.`);
    } catch (e) {
      setAviso(e.message);
    }
  }

  function agregado(participante) {
    setObra({ ...obra, participantes: [...obra.participantes, participante] });
    setAviso(participante.invitacionPendiente
      ? `Se agregó a ${participante.nombreCompleto} y se le envió la invitación.`
      : `Se agregó a ${participante.nombreCompleto}. Ya tenía cuenta, así que puede ingresar directamente.`);
  }

  return (
    <div className="pantalla">
      <BarraSuperior titulo={obra?.titulo ?? 'Obra'} volverA="/obras" />
      <main className="contenido">
        {error && <p className="texto-error">{error}</p>}
        {obra && (
          <>
            <h2 className="titulo-seccion">Datos de la obra</h2>
            <div className="tarjeta">
              <div className="tarjeta-fila">
                <span className="texto-secundario">{obra.ubicacion}</span>
                <span className={`etiqueta ${obra.estado === 'EN_CURSO' ? 'etiqueta-verde' : ''}`}>{ESTADOS_OBRA[obra.estado]}</span>
              </div>
              <p>{obra.descripcion}</p>
              <span className="texto-suave">Inicio: {formatearFecha(obra.fechaInicio)} · Arquitecto: {obra.arquitecto}</span>
            </div>

            <h2 className="titulo-seccion">Participantes</h2>
            {aviso && <p className="aviso">{aviso}</p>}
            {obra.participantes.map((p) => (
              <div key={p.id} className="tarjeta">
                <div className="tarjeta-fila">
                  <strong>{p.nombreCompleto}</strong>
                  {p.invitacionPendiente && <span className="etiqueta etiqueta-ambar">Invitación pendiente</span>}
                </div>
                <span className="texto-secundario">
                  {ROLES[p.rol]}{p.rubro && ` · ${RUBROS[p.rubro]}`}
                </span>
                <span className="texto-suave">{p.email}</span>
                {obra.esArquitecto && p.invitacionPendiente && (
                  <button type="button" className="boton boton-chico" onClick={() => reenviar(p)}>Reenviar invitación</button>
                )}
              </div>
            ))}

            {obra.esArquitecto && <FormularioParticipante idObra={idObra} alAgregar={agregado} />}
          </>
        )}
      </main>
    </div>
  );
}

function FormularioParticipante({ idObra, alAgregar }) {
  const [datos, setDatos] = useState(PARTICIPANTE_VACIO);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const participante = await api(`/obras/${idObra}/participantes`, { metodo: 'POST', datos });
      setDatos(PARTICIPANTE_VACIO);
      alAgregar(participante);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="formulario">
      <h2 className="titulo-seccion">Agregar participante</h2>
      <label className="campo">
        <span>Nombre completo</span>
        <input value={datos.nombreCompleto} onChange={cambiar('nombreCompleto')} maxLength={120} required />
      </label>
      <label className="campo">
        <span>Correo electrónico</span>
        <input type="email" value={datos.email} onChange={cambiar('email')} required />
      </label>
      <label className="campo">
        <span>Rol</span>
        <select value={datos.rol} onChange={cambiar('rol')}>
          <option value="ESPECIALISTA">{ROLES.ESPECIALISTA}</option>
          <option value="CUADRILLA">{ROLES.CUADRILLA}</option>
        </select>
      </label>
      <label className="campo">
        <span>Rubro</span>
        <select value={datos.rubro} onChange={cambiar('rubro')} required>
          <option value="" disabled>Elegí un rubro</option>
          {Object.entries(RUBROS).map(([valor, nombre]) => <option key={valor} value={valor}>{nombre}</option>)}
        </select>
      </label>
      {error && <p className="texto-error">{error}</p>}
      <button type="submit" className="boton boton-primario" disabled={enviando}>
        {enviando ? 'Agregando…' : 'Agregar y enviar invitación'}
      </button>
    </form>
  );
}
