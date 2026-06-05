export type UserRole = 'DIRECCION' | 'ADMIN' | 'OPERADOR';

export interface User {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellido?: string;
  rol: UserRole;
  rolId: number;
  comercioId?: number;
  comercioNombre?: string;
  activo: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
  cerrarSesionPrevia?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface UsuarioRequest {
  username: string;
  email: string;
  password?: string;
  nombre?: string;
  apellido?: string;
  rolId: number;
  comercioId?: number;
  activo?: boolean;
}

export interface Rol {
  id: number;
  codigo: UserRole;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface HealthResponse {
  status: string;
  userId: number;
  comercioId?: number;
  rol: string;
}
