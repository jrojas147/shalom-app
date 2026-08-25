export interface ConfiguracionSiigo {
  id: number;
  comercioId: number;
  activo: boolean;
  username?: string | null;
  accessKeyConfigured: boolean;
  documentTypeId?: number | null;
  paymentTypeId?: number | null;
  sellerId?: number | null;
  tokenExpiresAt?: string | null;
  partnerId: string;
}

export interface ConfiguracionSiigoRequest {
  activo: boolean;
  username?: string | null;
  accessKey?: string | null;
  documentTypeId?: number | null;
  paymentTypeId?: number | null;
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
