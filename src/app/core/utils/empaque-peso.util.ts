import { TipoEmpaque } from '../models/tipo-empaque.model';

/** Valor del select para linea sin globo y sin tara. */
export const EMPAQUE_SIN_NOMBRE = 'SIN EMPAQUE';

export function esSinEmpaque(nombre: string | null | undefined): boolean {
  const n = (nombre ?? '').trim();
  return n === '' || n.toUpperCase() === EMPAQUE_SIN_NOMBRE;
}

/** Peso del empaque en KG. Cero si es "Sin empaque". */
export function pesoEmpaqueKg(
  tipos: TipoEmpaque[],
  nombreEmpaque: string | null | undefined
): number {
  if (esSinEmpaque(nombreEmpaque)) {
    return 0;
  }
  return Number(tipos.find((t) => t.nombre === nombreEmpaque)?.peso) || 0;
}

/** Peso neto de material = bruto menos tara del empaque (nunca negativo). */
export function pesoNetoKg(pesoBruto: number, pesoEmpaque: number): number {
  const neto = (Number(pesoBruto) || 0) - (Number(pesoEmpaque) || 0);
  return Math.max(0, Math.round(neto * 1000) / 1000);
}

/** Peso bruto = peso del producto (neto) + tara del empaque. */
export function pesoBrutoFromNetoKg(pesoNeto: number, pesoEmpaque: number): number {
  const bruto = (Number(pesoNeto) || 0) + (Number(pesoEmpaque) || 0);
  return Math.max(0, Math.round(bruto * 1000) / 1000);
}
