import { TipoEmpaque } from '../models/tipo-empaque.model';

/** Peso del empaque en KG (valor parametrizado). */
export function pesoEmpaqueKg(
  tipos: TipoEmpaque[],
  nombreEmpaque: string | null | undefined
): number {
  if (!nombreEmpaque) {
    return 0;
  }
  return Number(tipos.find((t) => t.nombre === nombreEmpaque)?.peso) || 0;
}

/** Peso neto de material = bruto − tara del empaque (nunca negativo). */
export function pesoNetoKg(pesoBruto: number, pesoEmpaque: number): number {
  const neto = (Number(pesoBruto) || 0) - (Number(pesoEmpaque) || 0);
  return Math.max(0, Math.round(neto * 1000) / 1000);
}

/** Peso bruto = peso del producto (neto) + tara del empaque. */
export function pesoBrutoFromNetoKg(pesoNeto: number, pesoEmpaque: number): number {
  const bruto = (Number(pesoNeto) || 0) + (Number(pesoEmpaque) || 0);
  return Math.max(0, Math.round(bruto * 1000) / 1000);
}
