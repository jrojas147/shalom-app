import { TipoEmpaque } from '../models/tipo-empaque.model';

/** Peso del empaque en KG (valor parametrizado). No se descuenta ni se suma al peso de compras o ventas. */
export function pesoEmpaqueKg(
  tipos: TipoEmpaque[],
  nombreEmpaque: string | null | undefined
): number {
  if (!nombreEmpaque) {
    return 0;
  }
  return Number(tipos.find((t) => t.nombre === nombreEmpaque)?.peso) || 0;
}

/** @deprecated La tara del empaque no ajusta el peso de material en compras ni ventas. */
export function pesoNetoKg(pesoBruto: number, pesoEmpaque: number): number {
  const neto = (Number(pesoBruto) || 0) - (Number(pesoEmpaque) || 0);
  return Math.max(0, Math.round(neto * 1000) / 1000);
}

/** @deprecated La tara del empaque no ajusta el peso de material en compras ni ventas. */
export function pesoBrutoFromNetoKg(pesoNeto: number, pesoEmpaque: number): number {
  const bruto = (Number(pesoNeto) || 0) + (Number(pesoEmpaque) || 0);
  return Math.max(0, Math.round(bruto * 1000) / 1000);
}
