import { Producto } from './producto.model';

/** Valor persistido: nombre del tipo de empaque parametrizado. */
export type EmpaqueTipo = string;

export interface CompraDetalleItem {
  productoId: number;
  producto: Producto;
  pesoKg: number;
  empaque: EmpaqueTipo;
}
