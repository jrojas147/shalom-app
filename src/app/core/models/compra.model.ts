import { Producto } from './producto.model';

export type EmpaqueTipo = 'Globo Grande' | 'Globo Mediano' | 'Globo Pequeño' |  'OTRO';

export interface CompraDetalleItem {
  productoId: number;
  producto: Producto;
  pesoKg: number;
  empaque: EmpaqueTipo;
}

export const EMPAQUE_OPCIONES: { value: EmpaqueTipo; label: string }[] = [
  { value: 'Globo Grande', label: 'Globo Grande' },
  { value: 'Globo Mediano', label: 'Globo Mediano' },
  { value: 'Globo Pequeño', label: 'Globo Pequeño' },
  { value: 'OTRO', label: 'Otro' },
];
