export interface ConfiguracionIva {
  id: number;
  comercioId: number;
  porcentaje: number;
}

export interface ConfiguracionIvaRequest {
  porcentaje: number;
}
