import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { UnidadMedida } from '../models/unidad-medida.model';

@Injectable({ providedIn: 'root' })
export class UnidadesMedidaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/parametrizacion/unidades-medida`;

  getAll(): Observable<UnidadMedida[]> {
    return this.http.get<UnidadMedida[]>(this.baseUrl);
  }
}
