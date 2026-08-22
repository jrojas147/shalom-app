export type TipoLecturaPeso = 'MANUAL' | 'BASCULA' | 'AMBOS';

export interface ConfiguracionLecturaPeso {
  id: number;
  comercioId: number;
  preCompra: TipoLecturaPeso;
  venta: TipoLecturaPeso;
}

export interface ConfiguracionLecturaPesoRequest {
  preCompra: TipoLecturaPeso;
  venta: TipoLecturaPeso;
}

export const TIPOS_LECTURA_PESO: { id: TipoLecturaPeso; titulo: string; descripcion: string }[] = [
  {
    id: 'MANUAL',
    titulo: 'Ingreso manual',
    descripcion: 'El peso se captura con teclado o con los botones + y −.',
  },
  {
    id: 'BASCULA',
    titulo: 'Lectura de báscula',
    descripcion: 'El peso solo se obtiene desde la báscula.',
  },
  {
    id: 'AMBOS',
    titulo: 'Báscula y manual',
    descripcion: 'Se puede leer la báscula o ingresar el peso a mano.',
  },
];

export function permiteIngresoManual(modo: TipoLecturaPeso | null | undefined): boolean {
  return modo !== 'BASCULA';
}

export function permiteLecturaBascula(
  modo: TipoLecturaPeso | null | undefined,
  fallback = false
): boolean {
  if (modo == null) {
    return fallback;
  }
  return modo === 'BASCULA' || modo === 'AMBOS';
}
