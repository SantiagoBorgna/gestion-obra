import { useState } from 'react';
import { IconoOjo, IconoOjoTachado } from './Iconos.jsx';

// Contraseña con el ojo para mostrarla u ocultarla.
export default function CampoClave({ etiqueta, conOjo = true, ...propsInput }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      <div className="campo-con-icono">
        <input type={visible ? 'text' : 'password'} {...propsInput} />
        {conOjo && (
          <button type="button" className="campo-icono" onClick={() => setVisible(!visible)}
                  aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {visible ? <IconoOjoTachado /> : <IconoOjo />}
          </button>
        )}
      </div>
    </label>
  );
}
