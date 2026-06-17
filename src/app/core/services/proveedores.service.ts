import { Injectable } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import { Proveedor, ProveedorRequest } from '../models/proveedor.model';

const MOCK_PROVEEDORES: Proveedor[] = [
  {
    id: 1,
    nombre: 'Reciclados del Sur SRL',
    documento: '30-71234567-8',
    telefono: '11-4567-8901',
    email: 'contacto@recicladosdelsur.com',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Metalúrgica Norte',
    documento: '30-70987654-3',
    telefono: '351-555-0192',
    email: 'ventas@metalurgicanorte.com',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Juan Carlos Pérez',
    documento: '20-33445566-7',
    telefono: '11-2233-4455',
    activo: true,
  },
  {
    id: 4,
    nombre: 'EcoPlásticos SA',
    documento: '30-70112233-4',
    telefono: '221-444-5566',
    email: 'info@ecoplasticos.com',
    activo: false,
  },
];

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private proveedores = [...MOCK_PROVEEDORES];
  private nextId = MOCK_PROVEEDORES.length + 1;

  getAll(): Observable<Proveedor[]> {
    return of(this.sortByNombre([...this.proveedores])).pipe(delay(150));
  }

  getActivos(): Observable<Proveedor[]> {
    return this.getAll().pipe(map((items) => items.filter((p) => p.activo)));
  }

  create(request: ProveedorRequest): Observable<Proveedor> {
    const entity: Proveedor = {
      id: this.nextId++,
      nombre: request.nombre.trim(),
      documento: request.documento?.trim() || undefined,
      telefono: request.telefono?.trim() || undefined,
      email: request.email?.trim() || undefined,
      activo: request.activo ?? true,
    };
    this.proveedores.push(entity);
    return of(entity).pipe(delay(150));
  }

  update(id: number, request: ProveedorRequest): Observable<Proveedor> {
    const index = this.proveedores.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Proveedor no encontrado');
    }

    const updated: Proveedor = {
      ...this.proveedores[index],
      nombre: request.nombre.trim(),
      documento: request.documento?.trim() || undefined,
      telefono: request.telefono?.trim() || undefined,
      email: request.email?.trim() || undefined,
      activo: request.activo ?? true,
    };
    this.proveedores[index] = updated;
    return of(updated).pipe(delay(150));
  }

  delete(id: number): Observable<void> {
    this.proveedores = this.proveedores.filter((p) => p.id !== id);
    return of(void 0).pipe(delay(150));
  }

  private sortByNombre(items: Proveedor[]): Proveedor[] {
    return items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
}
