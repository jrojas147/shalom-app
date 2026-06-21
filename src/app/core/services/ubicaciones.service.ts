import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { Departamento, Municipio } from '../models/ubicacion.model';

@Injectable({ providedIn: 'root' })
export class UbicacionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/ubicaciones`;

  getDepartamentos(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.baseUrl}/departamentos`);
  }

  getMunicipiosByDepartamento(departamentoId: number): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${this.baseUrl}/departamentos/${departamentoId}/municipios`);
  }
}
