import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CORE_URL } from '../config/api.config';
import { CarteraCliente, CarteraPagoResponse, RegistrarPagoCarteraPayload } from '../models/cartera.model';

@Injectable({ providedIn: 'root' })
export class CarteraService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CORE_URL}/api/cartera`;

  listarPendientes(): Observable<CarteraCliente[]> {
    return this.http.get<CarteraCliente[]>(this.baseUrl);
  }

  registrarPago(ventaId: number, payload: RegistrarPagoCarteraPayload): Observable<CarteraPagoResponse> {
    return this.http.post<CarteraPagoResponse>(`${this.baseUrl}/ventas/${ventaId}/pagos`, payload);
  }
}
