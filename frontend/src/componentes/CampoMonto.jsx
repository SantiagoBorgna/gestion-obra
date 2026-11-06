// Monto en pesos con separador de miles mientras se escribe ("$ 1.450.000,50").
// Recibe y devuelve el valor sin formato ("1450000.50"), que es lo que espera el backend.
function aTexto(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  const [entero, decimales] = String(valor).split('.');
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${conMiles}${decimales !== undefined ? `,${decimales}` : ''}`;
}

function aValor(texto) {
  const limpio = texto.replace(/[^\d,]/g, '');
  const [entero, ...resto] = limpio.split(',');
  return resto.length > 0 ? `${entero}.${resto.join('').slice(0, 2)}` : entero;
}

export default function CampoMonto({ valor, alCambiar, placeholder = '$ 0', ...propsInput }) {
  return (
    <input type="text" inputMode="decimal" placeholder={placeholder} value={aTexto(valor)}
           onChange={(e) => alCambiar(aValor(e.target.value))} {...propsInput} />
  );
}
