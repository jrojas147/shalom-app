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
  direccion?: string;
  departamento?: string;
  municipio?: string;
  siigoId?: string | null;
  activo: boolean;
}

export interface ProveedorExternoRequest {
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  email?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
  activo?: boolean;
}
