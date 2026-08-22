import { Producto } from '../models/producto.model';

export type { TipoMedida } from '../models/producto.model';

export function productoEsUnidad(producto: Producto | null | undefined): boolean {
  return producto?.tipoMedida === 'UNIDAD';
}

export function unidadesItem(unidades: number | null | undefined): number {
  const value = Number(unidades);
  return Number.isFinite(value) && value >= 1 ? Math.trunc(value) : 1;
}

export function precioSufijo(producto: Producto | null | undefined): '/und' | '/kg' {
  return productoEsUnidad(producto) ? '/und' : '/kg';
}

export function unidadesParaEnvio(
  producto: Producto | null | undefined,
  unidades: number | null | undefined
): number | undefined {
  return productoEsUnidad(producto) ? unidadesItem(unidades) : undefined;
}

export function productoPrecioFijo(
  producto: Producto | null | undefined,
  modo: 'compra' | 'venta'
): number {
  if (!producto) {
    return 0;
  }
  if (modo === 'venta') {
    return Number(producto.precioVenta) || Number(producto.precioCompra) || 0;
  }
  return Number(producto.precioCompra) || Number(producto.precioVenta) || 0;
}

/** Total de la línea: precio fijo × unidades, o precio/kg × peso neto. */
export function totalLineaMedida(
  producto: Producto | null | undefined,
  pesoNeto: number,
  unidades: number | null | undefined,
  modo: 'compra' | 'venta'
): number {
  const precio = productoPrecioFijo(producto, modo);
  if (productoEsUnidad(producto)) {
    return precio * unidadesItem(unidades);
  }
  return precio * Math.max(0, Number(pesoNeto) || 0);
}
