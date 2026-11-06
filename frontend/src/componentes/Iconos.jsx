// Iconos de línea de las pantallas. Toman el color del texto que los rodea.
function Icono({ tamanio = 22, grosor = 2, children }) {
  return (
    <svg width={tamanio} height={tamanio} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconoVolver = () => <Icono grosor={2.4}><path d="M15 18l-6-6 6-6" /></Icono>;
export const IconoChevron = () => <Icono tamanio={18}><path d="M9 18l6-6-6-6" /></Icono>;
export const IconoPerfil = () => <Icono tamanio={20}><circle cx="12" cy="7.5" r="3.5" /><path d="M5.5 21v-3.5a6.5 6.5 0 0 1 13 0V21" /></Icono>;
export const IconoLapiz = () => <Icono tamanio={18}><path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" /><path d="M18.4 2.6a2 2 0 0 1 3 3L12 15l-4 1 1-4z" /></Icono>;
export const IconoEdificio = () => (
  <Icono tamanio={26}>
    <path d="M3 21h18" /><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    <path d="M10 8h.01M14 8h.01M10 12h.01M14 12h.01M10 16h.01M14 16h.01" />
  </Icono>
);
export const IconoOjo = () => <Icono tamanio={20}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Icono>;
export const IconoOjoTachado = () => <Icono tamanio={20}><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6" /></Icono>;
export const IconoAlerta = () => <Icono tamanio={24}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></Icono>;
export const IconoPuntos = () => <Icono tamanio={20} grosor={3}><path d="M12 5h.01M12 12h.01M12 19h.01" /></Icono>;
export const IconoEngranaje = () => (
  <Icono>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icono>
);

// Iconos del menú de la obra.
export const IconoLista = () => <Icono><path d="M10 6h11M10 12h11M10 18h11" /><path d="M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" /></Icono>;
export const IconoDocumento = () => <Icono><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5M9 13h3M9 17h6" /></Icono>;
export const IconoEscalones = () => <Icono><path d="M3 20h5v-5h5v-5h5V5h3" /></Icono>;
export const IconoLibro = () => <Icono><path d="M6 3h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6z" /><path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2M11 3v16M14 8h3" /></Icono>;
export const IconoPersonas = () => <Icono><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a7 7 0 0 1 14 0v1M16 4.100a4 4 0 0 1 0 7.800M22 21v-1a7 7 0 0 0-4-6.300" /></Icono>;
export const IconoBilletes = () => <Icono><rect x="6" y="8" width="16" height="11" rx="2" /><path d="M18 8V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" /><circle cx="14" cy="13.500" r="2" /></Icono>;
export const IconoRecibo = () => <Icono><path d="M5 3h14v18l-2.300-1.500L14.300 21 12 19.500 9.700 21l-2.400-1.500L5 21z" /><path d="M9 8h6M9 12h6" /></Icono>;
export const IconoBarras = () => <Icono><path d="M9 21V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v12" /><path d="M3 21v-7a1 1 0 0 1 1-1h5M15 21h5a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-5M3 21h18" /></Icono>;
export const IconoBandera = () => <Icono><path d="M5 22V4M5 4c4-3 8 3 14 0v10c-6 3-10-3-14 0" /></Icono>;
