import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/inicio/inicio.component').then((m) => m.InicioComponent),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard(['ADMIN', 'DIRECCION', 'OPERADOR'])],
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
