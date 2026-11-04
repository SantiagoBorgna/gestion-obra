import { useEffect } from 'react';

// Ventana de confirmación para las acciones que conviene pensar dos veces.
// Puede incluir campos adicionales como contenido, por ejemplo un motivo.
export default function DialogoConfirmacion({
  titulo, mensaje, textoConfirmar, enviando, deshabilitado, alConfirmar, alCancelar, children,
}) {
  useEffect(() => {
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') alCancelar();
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [alCancelar]);

  return (
    <div className="dialogo-fondo" onClick={alCancelar}>
      <div className="dialogo" role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo"
           onClick={(e) => e.stopPropagation()}>
        <h2 id="dialogo-titulo">{titulo}</h2>
        <p className="texto-secundario">{mensaje}</p>
        {children}
        <div className="dialogo-acciones">
          <button type="button" className="boton" onClick={alCancelar} autoFocus>Cancelar</button>
          <button type="button" className="boton boton-primario" onClick={alConfirmar} disabled={enviando || deshabilitado}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
