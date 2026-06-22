import { NavIconName } from './nav-icon/nav-icon.component';

export interface NavMenuItem {
  label: string;
  route: string;
  icon: NavIconName;
}

export const NAV_MENU_ITEMS: NavMenuItem[] = [
  { label: 'Inicio', route: '/app/inicio', icon: 'inicio' },
  { label: 'Compras', route: '/app/compras', icon: 'compra' },
  { label: 'Caja', route: '/app/caja', icon: 'caja' },
  { label: 'Venta', route: '/app/venta', icon: 'venta' },
  { label: 'Liquidacion', route: '/app/liquidacion', icon: 'liquidacion' },
  { label: 'Productos', route: '/app/productos', icon: 'productos' },
  // { label: 'Inventario', route: '/app/inventario', icon: 'inventario' }, // Habilitar más adelante
  { label: 'Proveedores', route: '/app/proveedores', icon: 'proveedores' },
  { label: 'Sucursales', route: '/app/sucursales', icon: 'sucursales' },
  { label: 'Aliados', route: '/app/aliados', icon: 'aliados' },
  { label: 'Clientes', route: '/app/clientes', icon: 'clientes' },
  { label: 'Usuarios', route: '/app/usuarios', icon: 'usuarios' },
  { label: 'Parametrizacion', route: '/app/parametrizacion', icon: 'parametrizacion' },
  { label: 'Perfil', route: '/app/perfil', icon: 'perfil' },
];
