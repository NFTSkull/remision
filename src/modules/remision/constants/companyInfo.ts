import type { CompanyInfo } from '../types';

/**
 * Datos opcionales de empresa.
 * El PDF ya no usa dirección fija; muestra ferreteria_nombre ficticia por remisión.
 */
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  rfc: '',
  addressLine: '',
  telefono: '',
  nombre: '',
};
