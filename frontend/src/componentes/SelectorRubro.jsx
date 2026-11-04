import { RUBROS } from '../constantes.js';

export default function SelectorRubro({ valor, alCambiar }) {
  return (
    <label className="campo">
      <span>Rubro</span>
      <select value={valor} onChange={(e) => alCambiar(e.target.value)} required>
        <option value="" disabled>Elegí un rubro</option>
        {Object.entries(RUBROS).map(([clave, nombre]) => <option key={clave} value={clave}>{nombre}</option>)}
      </select>
    </label>
  );
}
