import { UserRole } from '../models/user.model';

export const OPERADOR_APP_ROUTES = ['/app/compras', '/app/inventario'] as const;

export function getDefaultAppRoute(role: UserRole): string {
  return role === 'OPERADOR' ? OPERADOR_APP_ROUTES[0] : '/app/inicio';
}
