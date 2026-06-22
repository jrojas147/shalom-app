export interface EntidadBancaria {
  id: number;
  codigo: string;
  nombre: string;
  nit?: string;
}

export function formatEntidadBancariaLabel(entidad: EntidadBancaria): string {
  return `${entidad.codigo} — ${entidad.nombre}`;
}
