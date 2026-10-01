/** Error de un campo concreto, tal como lo informa la API en `details`. */
export interface DetalleValidacion {
  campo: string;
  mensaje: string;
}

/** Metadatos de paginación de los listados de la API. */
export interface MetaPaginacion {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Pagina<T> {
  data: T[];
  meta: MetaPaginacion;
}

/** Resultado de una escritura: el recurso y el mensaje que la API pide mostrar al usuario. */
export interface ResultadoEscritura<T> {
  mensaje: string;
  data: T;
}
