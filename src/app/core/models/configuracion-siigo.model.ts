export interface ConfiguracionSiigo {
  id: number;
  comercioId: number;
  activo: boolean;
  username?: string | null;
  accessKeyConfigured: boolean;
  documentTypeId?: number | null;
  paymentTypeId?: number | null;
  documentTypeDsId?: number | null;
  paymentTypeDsId?: number | null;
  costCenterDsId?: number | null;
  sellerId?: number | null;
  tokenExpiresAt?: string | null;
  partnerId: string;
}

export interface ConfiguracionSiigoRequest {
  activo: boolean;
  documentTypeId?: number | null;
  paymentTypeId?: number | null;
  documentTypeDsId?: number | null;
  paymentTypeDsId?: number | null;
  costCenterDsId?: number | null;
  sellerId?: number | null;
}

export interface SiigoPrueba {
  ok: boolean;
  mensaje: string;
  tokenExpiresAt?: string | null;
}

export interface SiigoCatalogoItem {
  id: number;
  codigo?: string | null;
  nombre: string;
  activo: boolean;
}

export interface SiigoProductoStock {
  codigo: string;
  existe: boolean;
  disponible?: number | null;
  nombre?: string | null;
}

export interface SiigoTerceroIdentificacion {
  existe: boolean;
  identificacion?: string | null;
  nombre?: string | null;
  siigoId?: string | null;
  tipo?: string | null;
}
