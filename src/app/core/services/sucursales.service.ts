import { Injectable } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { Sucursal, SucursalRequest } from '../models/sucursal.model';

const MOCK_SUCURSALES: Sucursal[] = [
  {
    id: 1,
    nombre: 'Casa Central',
    codigo: 'CC-001',
    direccion: 'Av. San Martín 1250, Córdoba',
    telefono: '351-400-1100',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Sucursal Norte',
    codigo: 'SN-002',
    direccion: 'Ruta 9 Km 12, Villa Allende',
    telefono: '351-400-2200',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Depósito Sur',
    codigo: 'DS-003',
    direccion: 'Camino Vecinal 450, Río Cuarto',
    telefono: '358-500-3300',
    activo: true,
  },
  {
    id: 4,
    nombre: 'Punto Retiro Oeste',
    codigo: 'PRO-004',
    direccion: 'Bv. Las Heras 890',
    activo: false,
  },
];

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private sucursales = [...MOCK_SUCURSALES];
  private nextId = MOCK_SUCURSALES.length + 1;

  getAll(): Observable<Sucursal[]> {
    return of(this.sortByNombre([...this.sucursales])).pipe(delay(150));
  }

  getActivas(): Observable<Sucursal[]> {
    return this.getAll().pipe(map((items) => items.filter((s) => s.activo)));
  }

  create(request: SucursalRequest): Observable<Sucursal> {
    const entity: Sucursal = {
      id: this.nextId++,
      nombre: request.nombre.trim(),
      codigo: request.codigo?.trim() || undefined,
      direccion: request.direccion?.trim() || undefined,
      telefono: request.telefono?.trim() || undefined,
      activo: request.activo ?? true,
    };
    this.sucursales.push(entity);
    return of(entity).pipe(delay(150));
  }

  update(id: number, request: SucursalRequest): Observable<Sucursal> {
    const index = this.sucursales.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Sucursal no encontrada');
    }

    const updated: Sucursal = {
      ...this.sucursales[index],
      nombre: request.nombre.trim(),
      codigo: request.codigo?.trim() || undefined,
      direccion: request.direccion?.trim() || undefined,
      telefono: request.telefono?.trim() || undefined,
      activo: request.activo ?? true,
    };
    this.sucursales[index] = updated;
    return of(updated).pipe(delay(150));
  }

  delete(id: number): Observable<void> {
    this.sucursales = this.sucursales.filter((s) => s.id !== id);
    return of(void 0).pipe(delay(150));
  }

  private sortByNombre(items: Sucursal[]): Sucursal[] {
    return items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
}
