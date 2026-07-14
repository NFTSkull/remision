import { normalizeMoney } from './normalizeMoney';

const UNIDADES = [
  '',
  'UN',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
];

const DECENAS = [
  '',
  '',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];

const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function convertirGrupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  const partes: string[] = [];
  if (c > 0) partes.push(CENTENAS[c]);

  if (d === 1) {
    partes.push(UNIDADES[10 + u]);
  } else if (d === 2 && u > 0) {
    partes.push(`VEINTI${UNIDADES[u].toLowerCase()}`.toUpperCase().replace('VEINTIUN', 'VEINTIÚN'));
  } else {
    if (d > 0) {
      partes.push(u > 0 ? `${DECENAS[d]} Y ${UNIDADES[u]}` : DECENAS[d]);
    } else if (u > 0) {
      partes.push(UNIDADES[u]);
    }
  }

  return partes.join(' ').replace('VEINTIUN', 'VEINTIÚN');
}

function convertirEntero(n: number): string {
  if (n === 0) return 'CERO';

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];

  if (millones > 0) {
    partes.push(
      millones === 1 ? 'UN MILLÓN' : `${convertirGrupo(millones)} MILLONES`,
    );
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'MIL' : `${convertirGrupo(miles)} MIL`);
  }
  if (resto > 0) {
    partes.push(convertirGrupo(resto));
  }

  return partes.join(' ').replace(/\s+/g, ' ').trim();
}

/** Convierte un monto numérico a letra en formato mexicano (PESOS xx/100 M.N.) */
export function numberToSpanishCurrency(amount: number): string {
  const normalized = normalizeMoney(Math.abs(amount));
  const entero = Math.floor(normalized);
  const centavos = Math.round((normalized - entero) * 100);

  const letras = convertirEntero(entero);
  const centavosStr = String(centavos).padStart(2, '0');

  const prefijo = amount < 0 ? 'MENOS ' : '';
  const moneda = entero === 1 ? 'PESO' : 'PESOS';

  return `${prefijo}${letras} ${moneda} ${centavosStr}/100 M.N.`;
}
