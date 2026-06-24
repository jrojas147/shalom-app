import { TipoDocumento } from './administrador-conjunto.model';

export interface ProveedorExterno {
  id: number;
  comercioId: number;
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  activo: boolean;
}

export interface ProveedorExternoRequest {
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  activo?: boolean;
}
