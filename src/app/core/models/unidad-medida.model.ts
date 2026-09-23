export type UnidadMedidaEstado = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';
export type TipoMedida = 'PESO' | 'UNIDAD';

export interface UnidadMedida {
  id: number;
  codigoSiigo: string;
  nombre: string;
  etiqueta: string;
  tipoMedida: TipoMedida;
  sistema: boolean;
  estado: UnidadMedidaEstado;
}
