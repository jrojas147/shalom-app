export interface Departamento {
  id: number;
  nombre: string;
}

export interface Municipio {
  id: number;
  departamentoId: number;
  nombre: string;
}
