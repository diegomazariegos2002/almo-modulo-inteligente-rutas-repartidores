/**
 * Reemplaza los marcadores `{{nombre}}` de una plantilla.
 * Un marcador sin valor se deja tal cual, para que el hueco sea visible.
 */
export function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (marcador, nombre: string) =>
    Object.prototype.hasOwnProperty.call(params, nombre) ? String(params[nombre]) : marcador,
  );
}
