// Cuentas que crea el seed del backend (docs/contrato-api.md, sección 2). Esta
// entrega es una demostración, por eso viajan en el bundle de todos los entornos:
// la pantalla de inicio de sesión las ofrece para entrar con un clic.
const PASSWORD_DEMO = 'Rutas2026*';

export const CUENTAS_DEMO = [
  { rol: 'CLIENTE', nombre: 'Cliente Demo', correo: 'cliente@almo.test', password: PASSWORD_DEMO },
  {
    rol: 'REPARTIDOR',
    nombre: 'Ana López',
    correo: 'repartidor1@almo.test',
    password: PASSWORD_DEMO,
  },
  {
    rol: 'REPARTIDOR',
    nombre: 'Bruno Castillo',
    correo: 'repartidor2@almo.test',
    password: PASSWORD_DEMO,
  },
  {
    rol: 'REPARTIDOR',
    nombre: 'Carla Méndez',
    correo: 'repartidor3@almo.test',
    password: PASSWORD_DEMO,
  },
  { rol: 'ADMIN', nombre: 'Despacho Demo', correo: 'admin@almo.test', password: PASSWORD_DEMO },
] as const;
