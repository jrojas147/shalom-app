import { normalizeUserRole } from '../../core/config/role-access';
import { UserRole } from '../../core/models/user.model';
import { NavIconName } from './nav-icon/nav-icon.component';

export interface NavMenuItem {
  label: string;
  route: string;
  icon: NavIconName;
}

const ADMIN_DIRECCION_MENU: NavMenuItem[] = [
  { label: 'Control', route: '/app/inicio', icon: 'inicio' },
  { label: 'Compras', route: '/app/compras', icon: 'compra' },
  { label: 'Caja', route: '/app/caja', icon: 'caja' },
  { label: 'Venta', route: '/app/venta', icon: 'venta' },
  { label: 'Retribución', route: '/app/liquidacion', icon: 'liquidacion' },
  { label: 'Gastos', route: '/app/gastos', icon: 'gastos' },
  { label: 'Productos', route: '/app/productos', icon: 'productos' },
  { label: 'Inventario', route: '/app/inventario', icon: 'inventario' },
  { label: 'Empaques', route: '/app/empaques', icon: 'empaques' },
  { label: 'Translados', route: '/app/movimientos', icon: 'movimientos' },
  { label: 'Proveedores', route: '/app/proveedores', icon: 'proveedores' },
  { label: 'Sucursales', route: '/app/sucursales', icon: 'sucursales' },
  { label: 'Clientes', route: '/app/clientes', icon: 'clientes' },
  { label: 'Usuarios', route: '/app/usuarios', icon: 'usuarios' },
  { label: 'Parametrizacion', route: '/app/parametrizacion', icon: 'parametrizacion' },
  //{ label: 'Perfil', route: '/app/perfil', icon: 'perfil' },
];

const DIRECCION_MENU: NavMenuItem[] = [
  ADMIN_DIRECCION_MENU[0],
  { label: 'Pre-compra', route: '/app/pre-compra', icon: 'compra' },
  ...ADMIN_DIRECCION_MENU.slice(1),
];

const OPERADOR_MENU: NavMenuItem[] = [
  { label: 'Pre-compra', route: '/app/pre-compra', icon: 'compra' },
  { label: 'Inventario', route: '/app/inventario', icon: 'inventario' },
  { label: 'Empaques', route: '/app/empaques', icon: 'empaques' },
  { label: 'Proveedores', route: '/app/proveedores', icon: 'proveedores' },
  { label: 'Clientes', route: '/app/clientes', icon: 'clientes' },
];

const NAV_BY_ROLE: Record<UserRole, NavMenuItem[]> = {
  ADMIN: ADMIN_DIRECCION_MENU,
  DIRECCION: DIRECCION_MENU,
  OPERADOR: OPERADOR_MENU,
};

export function getNavItemsForRole(role: string | null | undefined): NavMenuItem[] {
  const normalized = normalizeUserRole(role);
  if (!normalized) {
    return [];
  }
  return NAV_BY_ROLE[normalized];
}
