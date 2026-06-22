import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { EntidadBancaria } from '../models/entidad-bancaria.model';

@Injectable({ providedIn: 'root' })
export class EntidadesBancariasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/entidades-bancarias`;

  getAll(): Observable<EntidadBancaria[]> {
    return this.http.get<EntidadBancaria[]>(this.baseUrl);
  }
}
