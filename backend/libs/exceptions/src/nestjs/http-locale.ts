export const DEFAULT_LOCALE = 'es';

/**
 * Idioma preferido de la petición según `Accept-Language`.
 * Solo se usa el primer idioma y su subetiqueta principal (`en-US` → `en`).
 */
export function extractLocaleFromRequest(request: { headers: Record<string, string | string[] | undefined> }): string {
  const header = request.headers['accept-language'];
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return DEFAULT_LOCALE;

  const primera = value.split(',')[0]?.split(';')[0]?.trim().toLowerCase();
  const idioma = primera?.split('-')[0];
  return idioma && /^[a-z]{2,3}$/.test(idioma) ? idioma : DEFAULT_LOCALE;
}
