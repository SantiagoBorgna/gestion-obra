import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import DialogoConfirmacion from '../componentes/DialogoConfirmacion.jsx';
import { api } from '../api.js';
import { COLOR_ESTADO, ESTADOS_OBRA, ESTADOS_PRESUPUESTO, ROLES, RUBROS, formatearFecha } from '../constantes.js';
import { useSesion } from '../sesion/SesionContext.jsx';

const PARTICIPANTE_VACIO = { nombreCompleto: '', email: '', rol: 'ESPECIALISTA', rubro: '' };

export default function DetalleObra() {
  const { idObra } = useParams();
  const [obra, setObra] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [aReenviar, setAReenviar] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api(`/obras/${idObra}`).then(setObra).catch((e) => setError(e.message));
  }, [idObra]);

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

  const cancelarReenvio = useCallback(() => setAReenviar(null), []);

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

            <SeccionPresupuesto obra={obra} />

            <h2 className="titulo-seccion">Participantes</h2>
            {aviso && <p className="aviso">{aviso}</p>}
            {obra.participantes.map((p) => (
              <div key={p.id} className="tarjeta">
                <div className="tarjeta-fila">
                  <strong>{p.nombreCompleto}</strong>
                  {p.invitacionPendiente && <span className="etiqueta etiqueta-ambar">Invitación pendiente</span>}
                </div>
                <span className="texto-secundario">
                  {[ROLES[p.rol], RUBROS[p.rubro]].filter(Boolean).join(' · ')}
                </span>
                {p.email && <span className="texto-suave">{p.email}</span>}
                {obra.esArquitecto && p.invitacionPendiente && (
                  <button type="button" className="boton boton-chico" onClick={() => setAReenviar(p)}>Reenviar invitación</button>
                )}
              </div>
            ))}

            {obra.esArquitecto && <FormularioParticipante idObra={idObra} alAgregar={agregado} />}
          </>
        )}
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

function AccesoAlertas({ idObra }) {
  const [activas, setActivas] = useState(null);

  useEffect(() => {
    api(`/obras/${idObra}/alertas`).then((datos) => setActivas(datos.activas.length)).catch(() => setActivas(null));
  }, [idObra]);

  const texto = activas === null || activas === 0
    ? 'Alertas'
    : `${activas} ${activas === 1 ? 'alerta de desvío activa' : 'alertas de desvío activas'}`;
  return <Link to={`/obras/${idObra}/alertas`} className={`boton ${activas ? 'boton-peligro' : ''}`}>{texto}</Link>;
}

// Acceso al presupuesto: según el rol y el estado cambia el texto y a dónde lleva.
function SeccionPresupuesto({ obra }) {
  const { usuario } = useSesion();
  const [presupuesto, setPresupuesto] = useState(undefined);

  useEffect(() => {
    api(`/obras/${obra.id}/presupuesto`).then(setPresupuesto).catch(() => setPresupuesto(null));
  }, [obra.id]);

  if (presupuesto === undefined) return null;

  const esCliente = usuario.rol === 'CLIENTE';
  let contenido;
  if (presupuesto) {
    const textoColaborador = presupuesto.estado === 'EN_ESTIMACION' ? 'Cargar costos' : 'Ver costos';
    const textoBoton = obra.esArquitecto ? 'Ver presupuesto' : esCliente ? 'Revisar presupuesto' : textoColaborador;
    contenido = (
      <>
        <div className="tarjeta-fila">
          <span className="texto-secundario">Estado</span>
          <span className={`etiqueta ${COLOR_ESTADO[presupuesto.estado]}`}>{ESTADOS_PRESUPUESTO[presupuesto.estado]}</span>
        </div>
        <Link to={`/obras/${obra.id}/presupuesto`} className="boton boton-primario">{textoBoton}</Link>
        {presupuesto.estado === 'APROBADO' && (
          <Link to={`/obras/${obra.id}/pagos`} className="boton">
            {obra.esArquitecto ? 'Cobros y pagos' : esCliente ? 'Ver mis pagos a la obra' : 'Ver mis cobros'}
          </Link>
        )}
        {presupuesto.estado === 'APROBADO' && obra.esArquitecto && (
          <>
            <Link to={`/obras/${obra.id}/comparacion`} className="boton">Presupuesto y gasto</Link>
            <AccesoAlertas idObra={obra.id} />
          </>
        )}
      </>
    );
  } else if (obra.esArquitecto) {
    contenido = (
      <>
        <span className="texto-secundario">Cargá las tareas de la obra y solicitá los costos a los colaboradores.</span>
        <Link to={`/obras/${obra.id}/relevamiento`} className="boton boton-primario">Ir al relevamiento</Link>
      </>
    );
  } else {
    contenido = (
      <span className="texto-secundario">
        {esCliente ? 'El arquitecto todavía no presentó el presupuesto.' : 'Todavía no se solicitaron los costos.'}
      </span>
    );
  }

  return (
    <>
      <h2 className="titulo-seccion">Presupuesto</h2>
      <div className="tarjeta acciones-tarjeta">{contenido}</div>
    </>
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
