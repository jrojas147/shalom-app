import { UserRole } from '../models/user.model';

export const OPERADOR_APP_ROUTES = ['/app/pre-compra', '/app/inventario', '/app/clientes'] as const;

export function normalizeUserRole(rol: string | null | undefined): UserRole | null {
  if (!rol) {
    return null;
  }

  const normalized = rol.trim().toUpperCase();

  switch (normalized) {
    case 'ADMIN':
    case 'ADMINISTRADOR':
      return 'ADMIN';
    case 'DIRECCION':
    case 'DIRECCIÓN':
      return 'DIRECCION';
    case 'OPERADOR':
      return 'OPERADOR';
    default:
      return null;
  }
}

export function getDefaultAppRoute(role: string | null | undefined): string {
  const normalized = normalizeUserRole(role);
  return normalized === 'OPERADOR' ? OPERADOR_APP_ROUTES[0] : '/app/inicio';
}
