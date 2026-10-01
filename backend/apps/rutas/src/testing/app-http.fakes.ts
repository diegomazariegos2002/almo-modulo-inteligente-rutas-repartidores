/*
 * Aplicación HTTP de prueba: el servicio completo (controllers, guards, pipes,
 * interceptor, filtro, casos de uso) corriendo en el mismo proceso, con los
 * puertos de salida conectados a los dobles en memoria. No necesita base de
 * datos ni Redis. Solo para pruebas de integración.
 */
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  DomainExceptionFilter,
  I18nResolver,
  ResultHttpInterceptor,
  SimpleI18nResolver,
  validationExceptionFactory,
} from '@almo/exceptions/nestjs';
import { PrismaService } from '@almo/prisma';
import { ok } from '@almo/result';
import { ResourceOwnershipPort, type Rol, ROLES, SecurityModule } from '@almo/security';
import { hashPassword } from '@almo/security/password';
import { TransactionManagerPort } from '@almo/transactions';
import { IniciarSesionUseCase } from '../autenticacion/application/use-cases/iniciar-sesion/iniciar-sesion.use-case';
import { Usuario } from '../autenticacion/domain/entities/usuario.entity';
import { PasswordHasher } from '../autenticacion/domain/ports/outbound/password-hasher.port';
import { TokenEmisor } from '../autenticacion/domain/ports/outbound/token-emisor.port';
import { UsuarioRepository } from '../autenticacion/domain/ports/outbound/usuario.repository.port';
import { AutenticacionController } from '../autenticacion/infrastructure/inbound/http/autenticacion.controller';
import { JwtTokenEmisorAdapter } from '../autenticacion/infrastructure/outbound/security/jwt-token-emisor.adapter';
import { ScryptPasswordHasherAdapter } from '../autenticacion/infrastructure/outbound/security/scrypt-password-hasher.adapter';
import * as enMessages from '../i18n/en.json';
import * as esMessages from '../i18n/es.json';
import { DespachoService } from '../ordenes/application/services/despacho.service';
import { CrearOrdenUseCase } from '../ordenes/application/use-cases/crear-orden/crear-orden.use-case';
import { EntregarOrdenUseCase } from '../ordenes/application/use-cases/entregar-orden/entregar-orden.use-case';
import { IniciarRutaUseCase } from '../ordenes/application/use-cases/iniciar-ruta/iniciar-ruta.use-case';
import { ListarOrdenesUseCase } from '../ordenes/application/use-cases/listar-ordenes/listar-ordenes.use-case';
import { ObtenerOrdenUseCase } from '../ordenes/application/use-cases/obtener-orden/obtener-orden.use-case';
import { DespachoLock } from '../ordenes/domain/ports/outbound/despacho-lock.port';
import { OrdenRepository } from '../ordenes/domain/ports/outbound/orden.repository.port';
import { OrdenesController } from '../ordenes/infrastructure/inbound/http/ordenes.controller';
import { ListarRepartidoresUseCase } from '../repartidores/application/use-cases/listar-repartidores/listar-repartidores.use-case';
import { ObtenerRutaRepartidorUseCase } from '../repartidores/application/use-cases/obtener-ruta-repartidor/obtener-ruta-repartidor.use-case';
import { RepartidorRepository } from '../repartidores/domain/ports/outbound/repartidor.repository.port';
import { RutaCache } from '../repartidores/domain/ports/outbound/ruta-cache.port';
import { RepartidoresController } from '../repartidores/infrastructure/inbound/http/repartidores.controller';
import { RutasResourceOwnershipAdapter } from '../shared/infrastructure/ownership/rutas-resource-ownership.adapter';
import {
  BaseEnMemoria,
  DespachoLockEnMemoria,
  OrdenRepositoryEnMemoria,
  RepartidorRepositoryEnMemoria,
  RutaCacheEnMemoria,
  TxManagerEnMemoria,
} from './en-memoria.fakes';

/** Contraseña de todas las cuentas de la aplicación de prueba. */
export const PASSWORD_PRUEBA = 'clave-de-prueba';

/** Cuentas disponibles: dos clientes y dos repartidores para poder probar accesos cruzados. */
export const CUENTAS = {
  clienteA: { id: 'usu-cliente-a', correo: 'cliente.a@prueba.test', rol: ROLES.CLIENTE, repartidorId: null },
  clienteB: { id: 'usu-cliente-b', correo: 'cliente.b@prueba.test', rol: ROLES.CLIENTE, repartidorId: null },
  repartidor1: { id: 'usu-repartidor-1', correo: 'repartidor1@prueba.test', rol: ROLES.REPARTIDOR, repartidorId: 1 },
  repartidor2: { id: 'usu-repartidor-2', correo: 'repartidor2@prueba.test', rol: ROLES.REPARTIDOR, repartidorId: 2 },
  admin: { id: 'usu-admin', correo: 'admin@prueba.test', rol: ROLES.ADMIN, repartidorId: null },
  inactivo: { id: 'usu-inactivo', correo: 'inactivo@prueba.test', rol: ROLES.CLIENTE, repartidorId: null },
} as const satisfies Record<string, { id: string; correo: string; rol: Rol; repartidorId: number | null }>;

export type NombreCuenta = keyof typeof CUENTAS;

class UsuarioRepositoryEnMemoria extends UsuarioRepository {
  constructor(private readonly usuarios: Usuario[]) {
    super();
  }

  async findByCorreo(correo: string): ReturnType<UsuarioRepository['findByCorreo']> {
    return ok(this.usuarios.find((usuario) => usuario.correo === correo) ?? null);
  }
}

/**
 * Lo mínimo de PrismaService que usa el adaptador de pertenencia, servido desde
 * la base en memoria: así se prueba el adaptador real y no una copia de sus reglas.
 */
function prismaDePrueba(base: BaseEnMemoria): PrismaService {
  return {
    client: {
      orden: {
        findUnique: async ({ where }: { where: { folio: string } }) => {
          const fila = base.ordenes.find((orden) => orden.folio === where.folio);
          return fila ? { clienteId: fila.clienteId, repartidorId: fila.repartidorId } : null;
        },
      },
      repartidor: {
        findUnique: async ({ where }: { where: { id: number } }) => {
          const fila = base.repartidores.find((repartidor) => repartidor.id === where.id);
          return fila ? { id: fila.id } : null;
        },
      },
    },
  } as unknown as PrismaService;
}

export interface AppDePrueba {
  app: INestApplication;
  base: BaseEnMemoria;
  cache: RutaCacheEnMemoria;
}

export async function crearAppDePrueba(): Promise<AppDePrueba> {
  const base = new BaseEnMemoria();
  const tx = new TxManagerEnMemoria(base);
  const cache = new RutaCacheEnMemoria();

  const passwordHash = await hashPassword(PASSWORD_PRUEBA);
  const usuarios = Object.entries(CUENTAS).map(
    ([nombre, cuenta]) => new Usuario({ ...cuenta, nombre, passwordHash, activo: nombre !== 'inactivo' }),
  );

  const moduleRef = await Test.createTestingModule({
    imports: [SecurityModule.forRoot({ jwtSecret: 'secreto-solo-para-pruebas-de-integracion-0123456789', jwtExpiresInSeconds: 3600 })],
    controllers: [AutenticacionController, OrdenesController, RepartidoresController],
    providers: [
      { provide: I18nResolver, useValue: new SimpleI18nResolver({ es: esMessages, en: enMessages }) },
      { provide: APP_INTERCEPTOR, useClass: ResultHttpInterceptor },
      { provide: APP_FILTER, useClass: DomainExceptionFilter },

      // Puertos de salida → dobles en memoria.
      { provide: OrdenRepository, useValue: new OrdenRepositoryEnMemoria(base) },
      { provide: RepartidorRepository, useValue: new RepartidorRepositoryEnMemoria(base) },
      { provide: TransactionManagerPort, useValue: tx },
      { provide: DespachoLock, useValue: new DespachoLockEnMemoria(tx) },
      { provide: RutaCache, useValue: cache },
      { provide: UsuarioRepository, useValue: new UsuarioRepositoryEnMemoria(usuarios) },

      // Adaptadores reales que no necesitan infraestructura externa.
      { provide: PasswordHasher, useClass: ScryptPasswordHasherAdapter },
      { provide: TokenEmisor, useClass: JwtTokenEmisorAdapter },
      { provide: PrismaService, useValue: prismaDePrueba(base) },
      { provide: ResourceOwnershipPort, useClass: RutasResourceOwnershipAdapter },

      DespachoService,
      IniciarSesionUseCase,
      CrearOrdenUseCase,
      ListarOrdenesUseCase,
      ObtenerOrdenUseCase,
      IniciarRutaUseCase,
      EntregarOrdenUseCase,
      ObtenerRutaRepartidorUseCase,
      ListarRepartidoresUseCase,
    ],
  }).compile();

  // La misma configuración global que main.ts.
  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory: validationExceptionFactory }));
  await app.init();

  return { app, base, cache };
}
