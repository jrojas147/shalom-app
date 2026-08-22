import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { CajaService } from '../../core/services/caja.service';
import { HealthService } from '../../core/services/health.service';
import { InicioService } from '../../core/services/inicio.service';
import { RetribucionService } from '../../core/services/retribucion.service';
import { CompraResumen } from '../../core/models/compra-registro.model';
import { VentaResumen } from '../../core/models/venta.model';
import { RetribucionExterno, RetribucionInterno } from '../../core/models/retribucion.model';
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
  private readonly cajaService = inject(CajaService);
  private readonly retribucionService = inject(RetribucionService);

  readonly health = signal<HealthResponse | null>(null);
  readonly healthError = signal<string | null>(null);
  readonly loading = signal(false);

  readonly resumenCompras = signal<CompraResumen | null>(null);
  readonly comprasError = signal<string | null>(null);
  readonly loadingCompras = signal(false);

  readonly resumenVentas = signal<VentaResumen | null>(null);
  readonly ventasError = signal<string | null>(null);
  readonly loadingVentas = signal(false);

  readonly saldoCaja = signal<number | null>(null);
  readonly cajaAbierta = signal(false);
  readonly cajaError = signal<string | null>(null);
  readonly loadingCaja = signal(false);

  readonly pagosInternos = signal<RetribucionInterno[]>([]);
  readonly pagosExternos = signal<RetribucionExterno[]>([]);
  readonly pagosError = signal<string | null>(null);
  readonly loadingPagos = signal(false);

  readonly totalPagosInternos = computed(() =>
    this.sumPendiente(this.pagosInternos())
  );

  readonly totalPagosExternos = computed(() =>
    this.sumPendiente(this.pagosExternos())
  );

  readonly cantidadComprasInternos = computed(() =>
    this.sumCompras(this.pagosInternos())
  );

  readonly cantidadComprasExternos = computed(() =>
    this.sumCompras(this.pagosExternos())
  );

  ngOnInit(): void {
    this.cargarResumenCompras();
    this.cargarResumenVentas();
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

  cargarResumenVentas(): void {
    this.loadingVentas.set(true);
    this.ventasError.set(null);

    this.inicioService.getResumenVentas().subscribe({
      next: (resumen) => {
        this.resumenVentas.set(this.normalizeResumenVentas(resumen));
        this.loadingVentas.set(false);
      },
      error: (err) => {
        const msg =
          typeof err?.error?.message === 'string'
            ? err.error.message
            : 'No se pudo cargar el resumen de ventas.';
        this.ventasError.set(msg);
        this.loadingVentas.set(false);
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

    forkJoin({
      internos: this.retribucionService.listarInternosPendientesPago().pipe(
        catchError(() => of(null as RetribucionInterno[] | null))
      ),
      externos: this.retribucionService.listarExternosPendientesPago().pipe(
        catchError(() => of(null as RetribucionExterno[] | null))
      ),
    }).subscribe({
      next: ({ internos, externos }) => {
        if (internos == null && externos == null) {
          this.pagosInternos.set([]);
          this.pagosExternos.set([]);
          this.pagosError.set('No se pudieron cargar los pagos pendientes.');
        } else {
          this.pagosInternos.set(internos ?? []);
          this.pagosExternos.set(externos ?? []);
        }
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

  private normalizeResumenVentas(raw: VentaResumen): VentaResumen {
    return {
      totalHoy: this.toNumber(raw.totalHoy),
      pesoHoy: this.toNumber(raw.pesoHoy),
      cantidadHoy: this.toNumber(raw.cantidadHoy),
      totalSemana: this.toNumber(raw.totalSemana),
      pesoSemana: this.toNumber(raw.pesoSemana),
      cantidadSemana: this.toNumber(raw.cantidadSemana),
      totalMes: this.toNumber(raw.totalMes),
      pesoMes: this.toNumber(raw.pesoMes),
      cantidadMes: this.toNumber(raw.cantidadMes),
    };
  }

  private normalizeResumen(raw: CompraResumen): CompraResumen {
    return {
      totalHoy: this.toNumber(raw.totalHoy),
      pesoHoy: this.toNumber(raw.pesoHoy),
      cantidadHoy: this.toNumber(raw.cantidadHoy),
      totalSemana: this.toNumber(raw.totalSemana),
      pesoSemana: this.toNumber(raw.pesoSemana),
      cantidadSemana: this.toNumber(raw.cantidadSemana),
      totalMes: this.toNumber(raw.totalMes),
      pesoMes: this.toNumber(raw.pesoMes),
      cantidadMes: this.toNumber(raw.cantidadMes),
    };
  }

  private sumPendiente(
    items: Array<{ totalPendiente: number | string | null | undefined }>
  ): number {
    return items.reduce((sum, item) => sum + this.toNumber(item.totalPendiente), 0);
  }

  private sumCompras(
    items: Array<{ cantidadCompras: number | string | null | undefined }>
  ): number {
    return items.reduce((sum, item) => sum + this.toNumber(item.cantidadCompras), 0);
  }

  private toNumber(value: number | string | null | undefined): number {
    if (value == null) {
      return 0;
    }
    const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
