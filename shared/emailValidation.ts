/**
 * Validación de emails para Flow.cl
 * Flow rechaza emails de dominios no válidos
 */

// Lista de dominios de email comúnmente aceptados
const VALID_EMAIL_DOMAINS = [
  // Principales
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
  'icloud.com', 'me.com', 'mac.com',
  
  // Microsoft
  'live.com', 'msn.com', 'outlook.es', 'hotmail.es',
  
  // Yahoo variantes
  'yahoo.es', 'ymail.com',
  
  // Otros comunes
  'protonmail.com', 'aol.com', 'zoho.com',
  
  // Educativos y empresariales comunes
  'uc.cl', 'puc.cl', 'udp.cl', 'udd.cl', 'usach.cl',
];

/**
 * Valida que un email tenga un formato correcto y un dominio válido
 */
export function isValidEmail(email: string): boolean {
  // Validación básica de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Extraer dominio
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return false;
  }

  // Verificar si el dominio está en la lista de válidos
  return VALID_EMAIL_DOMAINS.includes(domain);
}

/**
 * Obtiene un mensaje de error amigable para emails inválidos
 */
export function getEmailErrorMessage(email: string): string {
  if (!email) {
    return 'El email es requerido';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'El formato del email no es válido';
  }

  const domain = email.split('@')[1]?.toLowerCase();
  return `Por favor usa un email de un proveedor común como Gmail, Outlook o Yahoo. El dominio "${domain}" podría no ser aceptado por el sistema de pagos.`;
}

/**
 * Sugiere dominios alternativos si el email es inválido
 */
export function suggestEmailDomains(): string[] {
  return ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
}
