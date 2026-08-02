import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CAJA_CONCEPTO_LABEL,
  Caja,
  CajaMovimientoConcepto,
} from '../../core/models/caja.model';
import { AuthService } from '../../core/services/auth.service';
import { CajaCierrePrintService } from '../../core/services/caja-cierre-print.service';
import { CajaService } from '../../core/services/caja.service';
import {
  formatCurrencyCo,
  parseCurrencyCo,
  resolveCurrencyCoCursor,
} from '../../core/utils/currency.util';
import { RpConfirmDialogService } from '../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss',
})
export class CajaComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly confirmDialog = inject(RpConfirmDialogService);
  private readonly auth = inject(AuthService);
  private readonly cierrePrintService = inject(CajaCierrePrintService);

  readonly tabs = [
    { id: 'movimientos' as const, label: 'Movimientos' },
    { id: 'historial' as const, label: 'Historial de cajas' },
  ];
  readonly tabActiva = signal<'movimientos' | 'historial'>('movimientos');

  readonly caja = signal<Caja | null>(null);
  readonly historial = signal<Caja[]>([]);
  readonly loading = signal(false);
  readonly loadingHistorial = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly esTabMovimientos = computed(() => this.tabActiva() === 'movimientos');
  readonly esTabHistorial = computed(() => this.tabActiva() === 'historial');

  readonly saldoCierre = signal(0);
  readonly saldoCierreDisplay = signal(formatCurrencyCo(0));
  readonly observacionCierre = signal('');

  saldoInicial = 0;
  readonly saldoInicialDisplay = signal(formatCurrencyCo(0));
  observacionApertura = '';

  readonly saldoTeorico = computed(() =>
    Number(this.caja()?.saldoTeorico ?? this.caja()?.saldoActual ?? 0)
  );
  readonly diferencia = computed(() => this.saldoCierre() - this.saldoTeorico());
  readonly tieneDiferencia = computed(() => Math.abs(this.diferencia()) > 0.009);

  ngOnInit(): void {
    this.cargarCaja();
    this.cargarHistorial();
  }

  setTab(tabId: 'movimientos' | 'historial'): void {
    this.tabActiva.set(tabId);
  }

  cargarCaja(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cajaService.obtenerActual().subscribe({
      next: (data) => {
        this.caja.set(data);
        if (data) {
          this.setSaldoCierre(Number(data.saldoActual ?? 0));
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 204) {
          this.caja.set(null);
          return;
        }
        this.error.set(this.extractErrorMessage(err, 'No se pudo cargar la caja.'));
      },
    });
  }

  cargarHistorial(): void {
    this.loadingHistorial.set(true);

    this.cajaService.historial().subscribe({
      next: (data) => {
        this.historial.set(data ?? []);
        this.loadingHistorial.set(false);
      },
      error: () => {
        this.historial.set([]);
        this.loadingHistorial.set(false);
      },
    });
  }

  abrirCaja(): void {
    if (this.saldoInicial < 0) {
      this.error.set('El saldo inicial no puede ser negativo.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);

    this.cajaService
      .abrir({
        saldoInicial: this.saldoInicial,
        observacion: this.observacionApertura.trim() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.saving.set(false);
          this.caja.set(data);
          this.setSaldoCierre(Number(data.saldoActual ?? 0));
          this.setSaldoInicial(0);
          this.mensaje.set('Caja abierta correctamente.');
          this.observacionApertura = '';
          this.cargarHistorial();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(this.extractErrorMessage(err, 'No se pudo abrir la caja.'));
        },
      });
  }

  cerrarCaja(): void {
    const actual = this.caja();
    if (!actual) return;

    if (this.saldoCierre() < 0) {
      this.error.set('El efectivo contado no puede ser negativo.');
      return;
    }

    if (this.tieneDiferencia() && !this.observacionCierre().trim()) {
      this.error.set(
        'Debe indicar una observación cuando el efectivo contado difiere del saldo teórico.'
      );
      return;
    }

    const diferencia = this.diferencia();
    const diferenciaTexto =
      diferencia === 0
        ? 'sin diferencia'
        : diferencia > 0
          ? `sobrante de ${this.formatCurrency(diferencia)}`
          : `faltante de ${this.formatCurrency(Math.abs(diferencia))}`;

    this.confirmDialog
      .confirm({
        title: 'Cerrar caja',
        message: `¿Cerrar la caja con efectivo contado ${this.formatCurrency(this.saldoCierre())} (${diferenciaTexto})? No podrá registrar más movimientos en este turno.`,
        confirmLabel: 'Cerrar caja',
        cancelLabel: 'Cancelar',
        confirmVariant: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.saving.set(true);
        this.error.set(null);
        this.mensaje.set(null);

        this.cajaService
          .cerrar({
            saldoCierre: this.saldoCierre(),
            observacion: this.observacionCierre().trim() || undefined,
          })
          .subscribe({
            next: (cerrada) => {
              this.imprimirCierre(cerrada);
              this.saving.set(false);
              this.caja.set(null);
              this.setSaldoInicial(0);
              this.setSaldoCierre(0);
              this.observacionCierre.set('');
              this.mensaje.set('Caja cerrada correctamente. Se generó el comprobante de cierre.');
              this.cargarHistorial();
            },
            error: (err) => {
              this.saving.set(false);
              this.error.set(this.extractErrorMessage(err, 'No se pudo cerrar la caja.'));
            },
          });
      });
  }

  onSaldoInicialInput(event: Event): void {
    this.applyCurrencyInput(event, (value) => this.setSaldoInicial(value));
  }

  onSaldoCierreInput(event: Event): void {
    this.applyCurrencyInput(event, (value) => this.setSaldoCierre(value));
  }

  onObservacionCierreChange(value: string): void {
    this.observacionCierre.set(value ?? '');
  }

  conceptoLabel(concepto: CajaMovimientoConcepto): string {
    return CAJA_CONCEPTO_LABEL[concepto] ?? concepto;
  }

  formatCurrency(value: number | null | undefined): string {
    return formatCurrencyCo(value ?? 0);
  }

  private applyCurrencyInput(event: Event, apply: (value: number) => void): void {
    const input = event.target as HTMLInputElement;
    const selectionStart = input.selectionStart ?? input.value.length;
    const digitsBefore = input.value.slice(0, selectionStart).replace(/\D/g, '').length;

    const parsed = parseCurrencyCo(input.value) ?? 0;
    const formatted = formatCurrencyCo(parsed);
    apply(parsed);
    input.value = formatted;

    const cursor = resolveCurrencyCoCursor(formatted, digitsBefore);
    requestAnimationFrame(() => input.setSelectionRange(cursor, cursor));
  }

  private setSaldoInicial(value: number): void {
    this.saldoInicial = value;
    this.saldoInicialDisplay.set(formatCurrencyCo(value));
  }

  private setSaldoCierre(value: number): void {
    this.saldoCierre.set(value);
    this.saldoCierreDisplay.set(formatCurrencyCo(value));
  }

  diferenciaLabel(value: number | null | undefined): string {
    const diferencia = Number(value) || 0;
    if (!this.tieneDiferenciaValor(diferencia)) {
      return 'Cuadra';
    }
    if (diferencia > 0) {
      return `Sobrante ${this.formatCurrency(diferencia)}`;
    }
    return `Faltante ${this.formatCurrency(Math.abs(diferencia))}`;
  }

  tieneDiferenciaValor(value: number | null | undefined): boolean {
    return Math.abs(Number(value) || 0) >= 0.009;
  }

  private imprimirCierre(caja: Caja): void {
    const user = this.auth.currentUser();
    const nombreUsuario = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();
    const usuarioCierre =
      caja.usuarioCierreNombre ?? (nombreUsuario || user?.username || 'Usuario');

    this.cierrePrintService.imprimir({
      cajaId: caja.id,
      comercioNombre: user?.comercioNombre ?? 'Comercio',
      usuarioApertura: caja.usuarioAperturaNombre ?? '—',
      usuarioCierre,
      openedAt: new Date(caja.openedAt),
      closedAt: caja.closedAt ? new Date(caja.closedAt) : new Date(),
      saldoInicial: Number(caja.saldoInicial) || 0,
      totalVentas: Number(caja.totalVentas) || 0,
      totalPagosProveedor: Number(caja.totalPagosProveedor) || 0,
      totalIngresos: Number(caja.totalIngresos) || 0,
      totalEgresos: Number(caja.totalEgresos) || 0,
      saldoTeorico: Number(caja.saldoTeorico ?? caja.saldoActual) || 0,
      saldoCierre: Number(caja.saldoCierre) || 0,
      diferencia: Number(caja.diferencia) || 0,
      observacion: caja.observacion,
    });
  }

  private extractErrorMessage(
    err: { error?: { message?: string; errors?: Record<string, string> }; status?: number },
    fallback: string
  ): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) return first;
    }
    return body?.message ?? fallback;
  }
}
