import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { SESION_CONTRACT } from '@auth/Application/contracts/sesion.contract';
import { PERMISOS } from '@auth/Domain/auth.models';
import { authGuard } from '@auth/Infrastructure/Guards/auth.guard';
import { permisoGuard } from '@auth/Infrastructure/Guards/permiso.guard';
import { PaginaEstadoComponent } from '@shared/Infrastructure/Angular/pagina-estado/pagina-estado.component';
import { enlacesPara } from '@shared/Infrastructure/Angular/shell/navegacion';
import { ShellComponent } from '@shared/Infrastructure/Angular/shell/shell.component';

/**
 * Pantalla inicial según los permisos: la primera entrada del menú que el usuario
 * puede ver. Angular resuelve las redirecciones antes de ejecutar los guards, por eso
 * aquí también se contempla que todavía no haya sesión.
 */
const redirigirAInicio = (): string => {
  const usuario = inject(SESION_CONTRACT).actual()?.usuario;
  if (!usuario) {
    return '/login';
  }
  return enlacesPara(usuario)[0]?.ruta ?? '/sin-permiso';
};

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Rutas',
    loadComponent: () =>
      import('@auth/Infrastructure/Angular/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: redirigirAInicio },
      {
        path: 'ordenes/nueva',
        title: 'Nueva orden · Rutas',
        canActivate: [permisoGuard(PERMISOS.ORDEN_CREAR)],
        loadComponent: () =>
          import('@ordenes/Infrastructure/Angular/nueva-orden-page/nueva-orden-page.component').then(
            (m) => m.NuevaOrdenPageComponent,
          ),
      },
      {
        path: 'ordenes',
        title: 'Órdenes · Rutas',
        canActivate: [permisoGuard(PERMISOS.ORDEN_LISTAR)],
        loadComponent: () =>
          import('@ordenes/Infrastructure/Angular/ordenes-page/ordenes-page.component').then(
            (m) => m.OrdenesPageComponent,
          ),
      },
      {
        path: 'mi-ruta',
        title: 'Mi ruta · Rutas',
        canActivate: [permisoGuard(PERMISOS.RUTA_LEER)],
        loadComponent: () =>
          import('@repartidores/Infrastructure/Angular/mi-ruta-page/mi-ruta-page.component').then(
            (m) => m.MiRutaPageComponent,
          ),
      },
      {
        path: 'despacho',
        title: 'Despacho · Rutas',
        canActivate: [permisoGuard(PERMISOS.REPARTIDOR_LISTAR)],
        loadComponent: () =>
          import('@repartidores/Infrastructure/Angular/despacho-page/despacho-page.component').then(
            (m) => m.DespachoPageComponent,
          ),
      },
      {
        path: 'sin-permiso',
        title: 'Sin permiso · Rutas',
        component: PaginaEstadoComponent,
        data: {
          codigo: 403,
          titulo: 'No tienes acceso a esta sección',
          descripcion: 'Tu usuario no tiene permiso para ver esta pantalla.',
        },
      },
      {
        path: '**',
        title: 'Página no encontrada · Rutas',
        component: PaginaEstadoComponent,
        data: {
          codigo: 404,
          titulo: 'No encontramos esta página',
          descripcion: 'La dirección no existe o cambió de lugar.',
        },
      },
    ],
  },
];
