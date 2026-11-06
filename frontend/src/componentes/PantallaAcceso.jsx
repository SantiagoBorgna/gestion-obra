import { IconoEdificio } from './Iconos.jsx';

// Fondo beige con la marca y una tarjeta blanca centrada (inicio de sesión y contraseñas).
export default function PantallaAcceso({ titulo, pie, children }) {
  return (
    <div className="pantalla-acceso">
      <div className="acceso-marca">
        <div className="acceso-logo"><IconoEdificio /></div>
        <h1>Gestión de Obra</h1>
      </div>
      <div className="tarjeta">
        {titulo && <h2>{titulo}</h2>}
        {children}
      </div>
      {pie && <p className="acceso-pie">{pie}</p>}
    </div>
  );
}
