import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const loadInicio = () =>
  import('./features/inicio/inicio.component').then((m) => m.InicioComponent);

const adminDireccion = roleGuard(['ADMIN', 'DIRECCION']);
const operadorOnly = roleGuard(['OPERADOR']);
const operadorModules = roleGuard(['ADMIN', 'DIRECCION', 'OPERADOR']);

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
      { path: 'inicio', canActivate: [adminDireccion], loadComponent: loadInicio },
      {
        path: 'pre-compra',
        canActivate: [operadorOnly],
        loadComponent: () =>
          import('./features/compras/compras.component').then((m) => m.ComprasComponent),
      },
      {
        path: 'compras',
        canActivate: [adminDireccion],
        loadComponent: () =>
          import('./features/gestion-compras/gestion-compras.component').then(
            (m) => m.GestionComprasComponent
          ),
      },
      { path: 'caja', canActivate: [adminDireccion], loadComponent: loadInicio },
      { path: 'venta', canActivate: [adminDireccion], loadComponent: loadInicio },
      { path: 'liquidacion', canActivate: [adminDireccion], loadComponent: loadInicio },
      {
        path: 'productos',
        canActivate: [adminDireccion],
        loadComponent: () =>
          import('./features/productos/productos.component').then((m) => m.ProductosComponent),
      },
      { path: 'inventario', canActivate: [operadorModules], loadComponent: loadInicio },
      {
        path: 'proveedores',
        canActivate: [adminDireccion],
        loadComponent: () =>
          import('./features/proveedores/proveedores.component').then((m) => m.ProveedoresComponent),
      },
      {
        path: 'clientes',
        canActivate: [operadorModules],
        loadComponent: () =>
          import('./features/clientes/clientes.component').then((m) => m.ClientesComponent),
      },
      { path: 'aliados', canActivate: [adminDireccion], loadComponent: loadInicio },
      { path: 'perfil', canActivate: [adminDireccion], loadComponent: loadInicio },
      {
        path: 'usuarios',
        canActivate: [adminDireccion],
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'sucursales',
        canActivate: [adminDireccion],
        loadComponent: () =>
          import('./features/sucursales/sucursales.component').then((m) => m.SucursalesComponent),
      },
      {
        path: 'parametrizacion',
        canActivate: [adminDireccion],
        loadComponent: () =>
          import('./features/parametrizacion/parametrizacion.component').then(
            (m) => m.ParametrizacionComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
