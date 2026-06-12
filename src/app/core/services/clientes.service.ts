import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Cliente } from '../models/cliente.model';

const MOCK_CLIENTES: Cliente[] = [
  { id: 1, nombre: 'Patricia Mendez', activo: true },
  { id: 2, nombre: 'Carlos Rodríguez', activo: true },
  { id: 3, nombre: 'María González', activo: true },
  { id: 4, nombre: 'Juan Pérez', activo: true },
  { id: 5, nombre: 'Ana Martínez', activo: false },
  { id: 6, nombre: 'Luis Fernández', activo: true },
];

@Injectable({ providedIn: 'root' })
export class ClientesService {
  getActivos(): Observable<Cliente[]> {
    return of(MOCK_CLIENTES.filter((c) => c.activo));
  }
}
