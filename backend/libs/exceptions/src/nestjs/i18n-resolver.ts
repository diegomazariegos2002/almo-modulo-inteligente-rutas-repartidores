import { interpolate } from '../lib/i18n.utils';

/** Árbol de mensajes de un idioma, tal como se escribe en `es.json` / `en.json`. */
export type I18nCatalog = Record<string, unknown>;

/**
 * Resuelve una clave i18n a un mensaje ya interpolado.
 *
 * Es una clase abstracta (y no una interfaz) para poder usarla directamente
 * como token de inyección en NestJS.
 */
export abstract class I18nResolver {
  /** Devuelve `undefined` si la clave no existe en ningún idioma disponible. */
  abstract resolve(key: string, params: Record<string, string | number>, locale: string): string | undefined;
}

/** Implementación en memoria sobre los JSON de mensajes que aporta cada servicio. */
export class SimpleI18nResolver extends I18nResolver {
  constructor(
    private readonly catalogs: Record<string, I18nCatalog>,
    private readonly fallbackLocale = 'es',
  ) {
    super();
  }

  resolve(key: string, params: Record<string, string | number>, locale: string): string | undefined {
    const template = this.lookup(locale, key) ?? this.lookup(this.fallbackLocale, key);
    return template === undefined ? undefined : interpolate(template, params);
  }

  private lookup(locale: string, key: string): string | undefined {
    let node: unknown = this.catalogs[locale];

    for (const part of key.split('.')) {
      if (typeof node !== 'object' || node === null) return undefined;
      node = (node as Record<string, unknown>)[part];
    }

    return typeof node === 'string' ? node : undefined;
  }
}
