export interface RetribucionInterno {
  recicladorId: number;
  nombre: string;
  tipoDocumento?: string | null;
  documento?: string | null;
  telefono?: string | null;
  activo: boolean;
  cantidadCompras: number;
  totalPendiente: number;
  pesoTotalPendiente: number;
}
