export type TipoDocumento = 'CC' | 'CE' | 'NIT' | 'PASAPORTE' | 'TI';

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de identidad' },
];

export interface AdministradorConjunto {
  id: number;
  comercioId: number;
  tipoDocumento: TipoDocumento;
  documento: string;
  nombre: string;
  telefono?: string;
  email?: string;
  fechaCumpleanos?: string;
  activo: boolean;
  cantidadConjuntos: number;
}

export interface AdministradorConjuntoRequest {
  tipoDocumento: TipoDocumento;
  documento: string;
  nombre: string;
  telefono?: string;
  email?: string;
  fechaCumpleanos?: string;
  activo?: boolean;
}

export function formatAdministradorLabel(admin: AdministradorConjunto): string {
  return `${admin.tipoDocumento} ${admin.documento} — ${admin.nombre}`;
}
