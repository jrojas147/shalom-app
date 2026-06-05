import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_AUTH_URL } from '../config/api.config';
import { Rol } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_AUTH_URL}/api/roles`;

  getAll(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.baseUrl);
  }
}
