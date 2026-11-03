// Fondo beige con la marca y una tarjeta blanca centrada (inicio de sesión y contraseñas).
export default function PantallaAcceso({ titulo, children }) {
  return (
    <div className="pantalla-acceso">
      <div className="acceso-marca">
        <div className="acceso-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5b4523" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
          </svg>
        </div>
        <h1>Gestión de Obra</h1>
      </div>
      <div className="tarjeta">
        {titulo && <h2>{titulo}</h2>}
        {children}
      </div>
    </div>
  );
}
