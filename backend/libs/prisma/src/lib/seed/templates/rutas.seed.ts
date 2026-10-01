import { hashPassword } from '@almo/security/password';
import type { PrismaClient } from '../../generated/client';

/**
 * Datos de demostración del dominio "rutas": 3 repartidores, 5 órdenes y las
 * cuentas de cada rol. El estado sembrado es coherente con las reglas del
 * sistema (cada orden está con el repartidor que le habría tocado y cada ruta
 * está en el orden que calcula el optimizador).
 */

/** Contraseña de las cuentas de demostración. Solo para el entorno de evaluación. */
export const PASSWORD_DEMO = process.env['SEED_PASSWORD_DEMO'] ?? 'Rutas2026*';

const ZONA = {
  z1: { lat: 14.6417, lng: -90.5133, nombre: 'Zona 1, Ciudad de Guatemala' },
  z4: { lat: 14.6229, lng: -90.5155, nombre: 'Zona 4, Ciudad de Guatemala' },
  z7: { lat: 14.634, lng: -90.55, nombre: 'Zona 7, Ciudad de Guatemala' },
  z10: { lat: 14.5995, lng: -90.5069, nombre: 'Zona 10, Ciudad de Guatemala' },
  z11: { lat: 14.613, lng: -90.554, nombre: 'Zona 11, Ciudad de Guatemala' },
  z12: { lat: 14.587, lng: -90.546, nombre: 'Zona 12, Ciudad de Guatemala' },
  z14: { lat: 14.587, lng: -90.512, nombre: 'Zona 14, Ciudad de Guatemala' },
} as const;

type Estado = 'PENDIENTE_ASIGNACION' | 'ASIGNADA' | 'EN_RUTA' | 'ENTREGADA';

interface OrdenSeed {
  folio: string;
  zona: { lat: number; lng: number; nombre: string };
  pesoKg: number;
  repartidorId: number;
  secuenciaRuta: number | null;
  /** Cambios de estado como [estado, minutos atrás]; el último es el estado actual. */
  historial: Array<[Estado, number]>;
}

const ORDENES: OrdenSeed[] = [
  {
    folio: 'ORD-000001',
    zona: ZONA.z11,
    pesoKg: 3,
    repartidorId: 3,
    secuenciaRuta: null,
    historial: [
      ['PENDIENTE_ASIGNACION', 180],
      ['ASIGNADA', 180],
      ['EN_RUTA', 120],
      ['ENTREGADA', 90],
    ],
  },
  {
    folio: 'ORD-000002',
    zona: ZONA.z12,
    pesoKg: 6,
    repartidorId: 3,
    secuenciaRuta: 1,
    historial: [
      ['PENDIENTE_ASIGNACION', 170],
      ['ASIGNADA', 170],
      ['EN_RUTA', 120],
    ],
  },
  {
    folio: 'ORD-000003',
    zona: ZONA.z4,
    pesoKg: 4.5,
    repartidorId: 1,
    secuenciaRuta: 1,
    historial: [
      ['PENDIENTE_ASIGNACION', 60],
      ['ASIGNADA', 60],
    ],
  },
  {
    folio: 'ORD-000004',
    zona: ZONA.z7,
    pesoKg: 3,
    repartidorId: 1,
    secuenciaRuta: 2,
    historial: [
      ['PENDIENTE_ASIGNACION', 45],
      ['ASIGNADA', 45],
    ],
  },
  {
    folio: 'ORD-000005',
    zona: ZONA.z14,
    pesoKg: 8,
    repartidorId: 2,
    secuenciaRuta: 1,
    historial: [
      ['PENDIENTE_ASIGNACION', 30],
      ['ASIGNADA', 30],
    ],
  },
];

const haceMinutos = (minutos: number): Date => new Date(Date.now() - minutos * 60_000);

/** Siembra los datos de demostración. Idempotente: si ya hay usuarios no hace nada. */
export async function seedRutas(prisma: PrismaClient): Promise<void> {
  if ((await prisma.usuario.count()) > 0) {
    console.log('  [rutas] La base ya tiene datos: se omite el seed.');
    return;
  }

  // Un hash por cuenta: aunque la contraseña sea la misma, cada una lleva su propia sal.
  const [hashCliente, hashAna, hashBruno, hashCarla, hashAdmin] = await Promise.all(
    Array.from({ length: 5 }, () => hashPassword(PASSWORD_DEMO)),
  );

  await prisma.$transaction(async (tx) => {
    // Ids explícitos para que la documentación y las URLs de ejemplo coincidan.
    await tx.repartidor.createMany({
      data: [
        { id: 1, nombre: 'Ana López', lat: ZONA.z1.lat, lng: ZONA.z1.lng, capacidadKg: 50, estado: 'DISPONIBLE' },
        { id: 2, nombre: 'Bruno Castillo', lat: ZONA.z10.lat, lng: ZONA.z10.lng, capacidadKg: 60, estado: 'DISPONIBLE' },
        // Carla ya entregó ORD-000001 (Zona 11): esa es su posición actual.
        { id: 3, nombre: 'Carla Méndez', lat: ZONA.z11.lat, lng: ZONA.z11.lng, capacidadKg: 40, estado: 'EN_RUTA' },
      ],
    });

    // Ids fijos: un token emitido antes de volver a sembrar sigue apuntando al mismo usuario.
    const cliente = await tx.usuario.create({
      data: {
        id: 'usu_demo_cliente',
        nombre: 'Cliente Demo',
        correo: 'cliente@almo.test',
        passwordHash: hashCliente as string,
        rol: 'CLIENTE',
      },
    });

    await tx.usuario.createMany({
      data: [
        {
          id: 'usu_demo_repartidor_1',
          nombre: 'Ana López',
          correo: 'repartidor1@almo.test',
          passwordHash: hashAna as string,
          rol: 'REPARTIDOR',
          repartidorId: 1,
        },
        {
          id: 'usu_demo_repartidor_2',
          nombre: 'Bruno Castillo',
          correo: 'repartidor2@almo.test',
          passwordHash: hashBruno as string,
          rol: 'REPARTIDOR',
          repartidorId: 2,
        },
        {
          id: 'usu_demo_repartidor_3',
          nombre: 'Carla Méndez',
          correo: 'repartidor3@almo.test',
          passwordHash: hashCarla as string,
          rol: 'REPARTIDOR',
          repartidorId: 3,
        },
        { id: 'usu_demo_admin', nombre: 'Despacho Demo', correo: 'admin@almo.test', passwordHash: hashAdmin as string, rol: 'ADMIN' },
      ],
    });

    for (const orden of ORDENES) {
      const [estadoActual, minutosUltimoCambio] = orden.historial[orden.historial.length - 1] as [Estado, number];
      const [, minutosCreacion] = orden.historial[0] as [Estado, number];

      await tx.orden.create({
        data: {
          folio: orden.folio,
          lat: orden.zona.lat,
          lng: orden.zona.lng,
          pesoKg: orden.pesoKg,
          direccion: orden.zona.nombre,
          estado: estadoActual,
          secuenciaRuta: orden.secuenciaRuta,
          clienteId: cliente.id,
          repartidorId: orden.repartidorId,
          creadoEn: haceMinutos(minutosCreacion),
          actualizadoEn: haceMinutos(minutosUltimoCambio),
          historial: {
            create: orden.historial.map(([estado, minutos]) => ({
              estado,
              fecha: haceMinutos(minutos),
              repartidorId: estado === 'PENDIENTE_ASIGNACION' ? null : orden.repartidorId,
            })),
          },
        },
      });
    }

    // Se insertaron ids y folios explícitos: las secuencias deben continuar después de ellos.
    await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('rutas.ru_repartidor', 'rep_id'), 3, true)`;
    await tx.$executeRaw`SELECT setval('rutas.seq_ru_orden_folio', ${ORDENES.length}, true)`;
  });

  console.log(`  [rutas] 3 repartidores, 5 usuarios y ${ORDENES.length} órdenes de demostración.`);
}

/**
 * Deja la base exactamente como recién sembrada: borra todo y vuelve a sembrar.
 * DESTRUCTIVO. Lo usan las pruebas e2e para partir siempre del mismo estado.
 */
export async function reiniciarRutas(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE rutas.ru_orden_historial, rutas.ru_orden, rutas.ru_usuario, rutas.ru_repartidor RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`ALTER SEQUENCE rutas.seq_ru_orden_folio RESTART WITH 1`;
  await seedRutas(prisma);
}
