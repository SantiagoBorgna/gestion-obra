import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BarraSuperior from '../componentes/BarraSuperior.jsx';
import { api } from '../api.js';

const VACIO = { titulo: '', ubicacion: '', fechaInicio: '', descripcion: '', nombreCliente: '', emailCliente: '' };

// Alta de obra (HU-01). El cliente se carga en el mismo formulario y recibe la invitación por correo.
export default function NuevaObra() {
  const navegar = useNavigate();
  const [datos, setDatos] = useState(VACIO);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const obra = await api('/obras', { metodo: 'POST', datos });
      navegar(`/obras/${obra.id}`, { replace: true });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <div className="pantalla">
      <BarraSuperior titulo="Mis obras" volverA="/obras" />
      <main className="contenido">
        <h1 className="titulo-pantalla">Nueva obra</h1>
        <form onSubmit={enviar} className="formulario">
          <h2 className="titulo-seccion">Datos de la obra</h2>
          <label className="campo">
            <span>Título</span>
            <input placeholder="Casa Barrio General Paz" value={datos.titulo} onChange={cambiar('titulo')} maxLength={150} required />
          </label>
          <label className="campo">
            <span>Ubicación</span>
            <input placeholder="Calle y número, ciudad" value={datos.ubicacion} onChange={cambiar('ubicacion')} maxLength={200} required />
          </label>
          <label className="campo">
            <span>Fecha de inicio</span>
            <input type="date" value={datos.fechaInicio} onChange={cambiar('fechaInicio')} required />
          </label>
          <label className="campo">
            <span>Descripción</span>
            <textarea placeholder="Vivienda unifamiliar de dos plantas" value={datos.descripcion} onChange={cambiar('descripcion')} maxLength={1000} rows={3} required />
          </label>

          <h2 className="titulo-seccion">Cliente</h2>
          <label className="campo">
            <span>Correo electrónico</span>
            <input type="email" placeholder="nombre@correo.com" value={datos.emailCliente} onChange={cambiar('emailCliente')} required />
          </label>
          <label className="campo">
            <span>Nombre completo</span>
            <input placeholder="Nombre y apellido" value={datos.nombreCliente} onChange={cambiar('nombreCliente')} maxLength={120} required />
          </label>

          {error && <p className="texto-error">{error}</p>}
          <button type="submit" className="boton" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Crear obra'}
          </button>
        </form>
      </main>
    </div>
  );
}
