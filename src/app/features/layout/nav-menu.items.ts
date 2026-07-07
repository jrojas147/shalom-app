import { UserRole } from '../../core/models/user.model';
import { NavIconName } from './nav-icon/nav-icon.component';

export interface NavMenuItem {
  label: string;
  route: string;
  icon: NavIconName;
  roles: UserRole[];
}

export const NAV_MENU_ITEMS: NavMenuItem[] = [
  { label: 'Inicio', route: '/app/inicio', icon: 'inicio', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Pre-compra', route: '/app/compras', icon: 'compra', roles: ['ADMIN', 'DIRECCION', 'OPERADOR'] },
  { label: 'Caja', route: '/app/caja', icon: 'caja', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Venta', route: '/app/venta', icon: 'venta', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Retribución', route: '/app/liquidacion', icon: 'liquidacion', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Productos', route: '/app/productos', icon: 'productos', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Inventario', route: '/app/inventario', icon: 'inventario', roles: ['ADMIN', 'DIRECCION', 'OPERADOR'] },
  { label: 'Proveedores', route: '/app/proveedores', icon: 'proveedores', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Sucursales', route: '/app/sucursales', icon: 'sucursales', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Clientes', route: '/app/clientes', icon: 'clientes', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Usuarios', route: '/app/usuarios', icon: 'usuarios', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Parametrizacion', route: '/app/parametrizacion', icon: 'parametrizacion', roles: ['ADMIN', 'DIRECCION'] },
  { label: 'Perfil', route: '/app/perfil', icon: 'perfil', roles: ['ADMIN', 'DIRECCION'] },
];

export function getNavItemsForRole(role: UserRole): NavMenuItem[] {
  return NAV_MENU_ITEMS.filter((item) => item.roles.includes(role));
}
