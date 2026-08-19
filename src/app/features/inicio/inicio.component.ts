import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CajaService } from '../../core/services/caja.service';
import { HealthService } from '../../core/services/health.service';
import { InicioService } from '../../core/services/inicio.service';
import { RetribucionService } from '../../core/services/retribucion.service';
import { CompraResumen } from '../../core/models/compra-registro.model';
import { RetribucionInterno } from '../../core/models/retribucion.model';
import { HealthResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
})
export class InicioComponent implements OnInit {
  private readonly healthService = inject(HealthService);
  private readonly inicioService = inject(InicioService);
  private readonly cajaService = inject(CajaService);
  private readonly retribucionService = inject(RetribucionService);
  readonly auth = inject(AuthService);

  readonly health = signal<HealthResponse | null>(null);
  readonly healthError = signal<string | null>(null);
  readonly loading = signal(false);

  readonly resumenCompras = signal<CompraResumen | null>(null);
  readonly comprasError = signal<string | null>(null);
  readonly loadingCompras = signal(false);

  readonly saldoCaja = signal<number | null>(null);
  readonly cajaAbierta = signal(false);
  readonly cajaError = signal<string | null>(null);
  readonly loadingCaja = signal(false);

  readonly pagosPendientes = signal<RetribucionInterno[]>([]);
  readonly pagosError = signal<string | null>(null);
  readonly loadingPagos = signal(false);

  readonly totalPagosPendientes = computed(() =>
    this.pagosPendientes().reduce(
      (sum, item) => sum + this.toNumber(item.totalPendiente),
      0
    )
  );

  readonly cantidadComprasPendientes = computed(() =>
    this.pagosPendientes().reduce(
      (sum, item) => sum + this.toNumber(item.cantidadCompras),
      0
    )
  );

  ngOnInit(): void {
    this.cargarResumenCompras();
    this.cargarSaldoCaja();
    this.cargarPagosPendientes();
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

  cargarSaldoCaja(): void {
    this.loadingCaja.set(true);
    this.cajaError.set(null);

    this.cajaService.obtenerActual().subscribe({
      next: (caja) => {
        if (caja) {
          this.cajaAbierta.set(true);
          this.saldoCaja.set(this.toNumber(caja.saldoActual));
        } else {
          this.cajaAbierta.set(false);
          this.saldoCaja.set(0);
        }
        this.loadingCaja.set(false);
      },
      error: (err) => {
        if (err?.status === 204) {
          this.cajaAbierta.set(false);
          this.saldoCaja.set(0);
          this.loadingCaja.set(false);
          return;
        }
        this.cajaError.set(
          typeof err?.error?.message === 'string'
            ? err.error.message
            : 'No se pudo cargar el saldo de caja.'
        );
        this.saldoCaja.set(null);
        this.loadingCaja.set(false);
      },
    });
  }

  cargarPagosPendientes(): void {
    this.loadingPagos.set(true);
    this.pagosError.set(null);

    this.retribucionService.listarInternosPendientesPago().subscribe({
      next: (data) => {
        this.pagosPendientes.set(data);
        this.loadingPagos.set(false);
      },
      error: (err) => {
        this.pagosPendientes.set([]);
        this.pagosError.set(
          typeof err?.error?.message === 'string'
            ? err.error.message
            : 'No se pudieron cargar los pagos pendientes.'
        );
        this.loadingPagos.set(false);
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

  formatPeso(value: number | string | null | undefined): string {
    const amount = this.toNumber(value);
    return amount.toLocaleString('es-CO', {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    });
  }

  private normalizeResumen(raw: CompraResumen): CompraResumen {
    return {
      totalHoy: this.toNumber(raw.totalHoy),
      pesoHoy: this.toNumber(raw.pesoHoy),
      cantidadHoy: this.toNumber(raw.cantidadHoy),
      totalSemana: this.toNumber(raw.totalSemana),
      pesoSemana: this.toNumber(raw.pesoSemana),
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
