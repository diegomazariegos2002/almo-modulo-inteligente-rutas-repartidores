export interface CrearOrdenCommand {
  /** Usuario que registra la orden. */
  clienteId: string;
  lat: number;
  lng: number;
  /** Peso del paquete en kilogramos. */
  peso: number;
  /** Referencia de texto del destino. */
  direccion?: string | null;
}
