import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Ruta } from '../../../Domain/ruta.entity';

interface Coordenada {
  lat: number;
  lng: number;
}

interface Punto {
  x: number;
  y: number;
}

const ANCHO = 320;
const ALTO = 220;
/** Espacio libre alrededor del trazo para que los marcadores no se corten en el borde. */
const MARGEN = 28;

/**
 * Lleva las coordenadas geográficas a la caja del SVG. Usa la misma escala en los dos
 * ejes para no deformar la ruta y la centra en la caja.
 */
function proyectar(coordenadas: readonly Coordenada[]): Punto[] {
  const latitudes = coordenadas.map((coordenada) => coordenada.lat);
  const longitudes = coordenadas.map((coordenada) => coordenada.lng);
  const latMax = Math.max(...latitudes);
  const latMin = Math.min(...latitudes);
  const lngMin = Math.min(...longitudes);

  // Lejos del ecuador un grado de longitud mide menos que uno de latitud: sin esta
  // corrección la ruta saldría estirada a lo ancho.
  const factorLng = Math.cos((((latMax + latMin) / 2) * Math.PI) / 180);
  const anchoGeo = (Math.max(...longitudes) - lngMin) * factorLng;
  const altoGeo = latMax - latMin;

  // Un eje sin extensión (todos los puntos alineados o un solo punto) no limita la escala.
  const escalaX = anchoGeo > 0 ? (ANCHO - 2 * MARGEN) / anchoGeo : Infinity;
  const escalaY = altoGeo > 0 ? (ALTO - 2 * MARGEN) / altoGeo : Infinity;
  const escalaMinima = Math.min(escalaX, escalaY);
  const escala = Number.isFinite(escalaMinima) ? escalaMinima : 0;

  const inicioX = (ANCHO - anchoGeo * escala) / 2;
  const inicioY = (ALTO - altoGeo * escala) / 2;

  return coordenadas.map(({ lat, lng }) => ({
    x: redondear(inicioX + (lng - lngMin) * factorLng * escala),
    // La Y del SVG crece hacia abajo y el norte va arriba: se invierte la latitud.
    y: redondear(inicioY + (latMax - lat) * escala),
  }));
}

function redondear(valor: number): number {
  return Math.round(valor * 10) / 10;
}

/**
 * Mapa esquemático de la ruta: la posición del repartidor, las paradas numeradas en
 * el orden de visita y el trazo que las une. Se dibuja solo con las coordenadas; no
 * usa teselas ni servicios externos.
 */
@Component({
  selector: 'app-mapa-ruta',
  templateUrl: './mapa-ruta.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapaRutaComponent {
  readonly ruta = input.required<Ruta>();

  protected readonly cajaVista = `0 0 ${ANCHO} ${ALTO}`;

  /** El primer punto es el repartidor; los siguientes, sus paradas en orden. */
  private readonly puntos = computed(() => {
    const { repartidor, paradas } = this.ruta();
    return proyectar([repartidor, ...paradas]);
  });

  protected readonly origen = computed(() => this.puntos()[0]);
  protected readonly paradas = computed(() =>
    this.puntos()
      .slice(1)
      .map((punto, indice) => ({ ...punto, secuencia: this.ruta().paradas[indice].secuencia })),
  );
  protected readonly trazo = computed(() =>
    this.puntos()
      .map((punto) => `${punto.x},${punto.y}`)
      .join(' '),
  );

  protected readonly descripcion = computed(() => {
    const { repartidor, totalParadas, distanciaTotalKm } = this.ruta();
    const paradas = totalParadas === 1 ? '1 parada' : `${totalParadas} paradas`;
    return `Mapa esquemático de la ruta de ${repartidor.nombre}: ${paradas}, ${distanciaTotalKm} km en total.`;
  });
}
