import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';
import { InicioService } from '../../core/services/inicio.service';
import { CompraResumen } from '../../core/models/compra-registro.model';
import { HealthResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
})
export class InicioComponent implements OnInit {
  private readonly healthService = inject(HealthService);
  private readonly inicioService = inject(InicioService);
  readonly auth = inject(AuthService);

  readonly health = signal<HealthResponse | null>(null);
  readonly healthError = signal<string | null>(null);
  readonly loading = signal(false);

  readonly resumenCompras = signal<CompraResumen | null>(null);
  readonly comprasError = signal<string | null>(null);
  readonly loadingCompras = signal(false);

  cashBalance = '$3.840.000';
  pendingPayments = '$1.200,00';

  ngOnInit(): void {
    this.cargarResumenCompras();
  }

  cargarResumenCompras(): void {
    this.loadingCompras.set(true);
    this.comprasError.set(null);

    this.inicioService.getResumenCompras().subscribe({
      next: (resumen) => {
        this.resumenCompras.set(this.normalizeResumen(resumen));
        this.loadingCompras.set(false);
      },
      error: (err) => {
        const msg =
          typeof err?.error?.message === 'string'
            ? err.error.message
            : 'No se pudo cargar el resumen de compras.';
        this.comprasError.set(msg);
        this.loadingCompras.set(false);
      },
    });
  }

  checkHealth(): void {
    this.loading.set(true);
    this.healthError.set(null);

    this.healthService.check().subscribe({
      next: (response) => {
        this.health.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.healthError.set('No se pudo validar el token en shalom-core.');
        this.loading.set(false);
      },
    });
  }

  formatCurrency(value: number | string | null | undefined): string {
    const amount = this.toNumber(value);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private normalizeResumen(raw: CompraResumen): CompraResumen {
    return {
      totalHoy: this.toNumber(raw.totalHoy),
      cantidadHoy: this.toNumber(raw.cantidadHoy),
      totalSemana: this.toNumber(raw.totalSemana),
      cantidadSemana: this.toNumber(raw.cantidadSemana),
    };
  }

  private toNumber(value: number | string | null | undefined): number {
    if (value == null) {
      return 0;
    }
    const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
