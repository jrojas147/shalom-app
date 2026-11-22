import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import {
  ImportarProveedoresSiigoResultado,
  ProveedorSiigo,
} from '../models/proveedor.model';

@Injectable({ providedIn: 'root' })
export class ProveedoresSiigoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/proveedores/siigo`;

  listar(): Observable<ProveedorSiigo[]> {
    return this.http.get<ProveedorSiigo[]>(this.baseUrl);
  }

  importar(siigoIds: string[]): Observable<ImportarProveedoresSiigoResultado> {
    return this.http.post<ImportarProveedoresSiigoResultado>(`${this.baseUrl}/importar`, {
      siigoIds,
    });
  }
}
