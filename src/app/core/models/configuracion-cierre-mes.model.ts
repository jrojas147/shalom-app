export interface ConfiguracionCierreMes {
  id: number;
  comercioId: number;
  diaCierre: number;
}

export interface ConfiguracionCierreMesRequest {
  diaCierre: number;
}

export const DIAS_CIERRE_MES: number[] = Array.from({ length: 28 }, (_, i) => i + 1);
