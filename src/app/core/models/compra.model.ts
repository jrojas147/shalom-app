import { Producto } from './producto.model';

export type EmpaqueTipo = 'BOLSA' | 'CAJA' | 'GRANEL' | 'OTRO';

export interface CompraDetalleItem {
  productoId: number;
  producto: Producto;
  pesoKg: number;
  empaque: EmpaqueTipo;
}

export const EMPAQUE_OPCIONES: { value: EmpaqueTipo; label: string }[] = [
  { value: 'GRANEL', label: 'Granel' },
  { value: 'BOLSA', label: 'Bolsa' },
  { value: 'CAJA', label: 'Caja' },
  { value: 'OTRO', label: 'Otro' },
];
