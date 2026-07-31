import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { Compra } from '../models/compra-registro.model';
import { RetribucionInterno } from '../models/retribucion.model';

@Injectable({ providedIn: 'root' })
export class RetribucionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/retribucion`;

  listarInternosPendientesPago(): Observable<RetribucionInterno[]> {
    return this.http.get<RetribucionInterno[]>(`${this.baseUrl}/internos`);
  }

  listarComprasPendientesInterno(recicladorId: number): Observable<Compra[]> {
    return this.http.get<Compra[]>(`${this.baseUrl}/internos/${recicladorId}/compras`);
  }
}
