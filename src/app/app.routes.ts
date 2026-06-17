import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const loadInicio = () =>
  import('./features/inicio/inicio.component').then((m) => m.InicioComponent);

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
      { path: 'inicio', loadComponent: loadInicio },
      {
        path: 'compras',
        loadComponent: () =>
          import('./features/compras/compras.component').then((m) => m.ComprasComponent),
      },
      { path: 'caja', loadComponent: loadInicio },
      { path: 'venta', loadComponent: loadInicio },
      { path: 'liquidacion', loadComponent: loadInicio },
      { path: 'productos', loadComponent: loadInicio },
      { path: 'inventario', loadComponent: loadInicio },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('./features/proveedores/proveedores.component').then((m) => m.ProveedoresComponent),
      },
      { path: 'clientes', loadComponent: loadInicio },
      { path: 'aliados', loadComponent: loadInicio },
      { path: 'perfil', loadComponent: loadInicio },
      {
        path: 'usuarios',
        canActivate: [roleGuard(['ADMIN', 'DIRECCION', 'OPERADOR'])],
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'parametrizacion',
        loadComponent: () =>
          import('./features/parametrizacion/parametrizacion.component').then(
            (m) => m.ParametrizacionComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
