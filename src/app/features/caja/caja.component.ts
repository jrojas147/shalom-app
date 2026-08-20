import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CAJA_CONCEPTO_LABEL,
  Caja,
  CajaMovimientoConcepto,
  CajaSaldo,
} from '../../core/models/caja.model';
import { MedioCaja, medioCajaDetalle } from '../../core/models/medio-caja.model';
import { AuthService } from '../../core/services/auth.service';
import { CajaCierrePrintService } from '../../core/services/caja-cierre-print.service';
import { CajaService } from '../../core/services/caja.service';
import { MediosCajaService } from '../../core/services/medios-caja.service';
import {
  formatCurrencyCo,
  parseCurrencyCo,
  resolveCurrencyCoCursor,
} from '../../core/utils/currency.util';
import { RpConfirmDialogService } from '../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

interface SaldoAperturaFila {
  medio: MedioCaja;
  valor: number;
  display: string;
}

interface SaldoCierreFila {
  saldo: CajaSaldo;
  valor: number;
  display: string;
}

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [DatePipe, FormsModule, RpModalComponent],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss',
})
export class CajaComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly mediosCajaService = inject(MediosCajaService);
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
  readonly showCierreModal = signal(false);
  readonly showAperturaModal = signal(false);
  readonly loadingMediosApertura = signal(false);
  readonly filasApertura = signal<SaldoAperturaFila[]>([]);
  readonly filasCierre = signal<SaldoCierreFila[]>([]);

  readonly esTabMovimientos = computed(() => this.tabActiva() === 'movimientos');
  readonly esTabHistorial = computed(() => this.tabActiva() === 'historial');
  readonly saldosCaja = computed(() => this.caja()?.saldos ?? []);

  readonly observacionCierre = signal('');

  readonly montoAbono = signal(0);
  readonly montoAbonoDisplay = signal(formatCurrencyCo(0));
  readonly observacionAbono = signal('');
  readonly medioAbonoId = signal<number | null>(null);

  observacionApertura = '';

  readonly saldoTeorico = computed(() =>
    Number(this.caja()?.saldoTeorico ?? this.caja()?.saldoActual ?? 0)
  );
  readonly saldoCierreTotal = computed(() =>
    this.filasCierre().reduce((sum, fila) => sum + fila.valor, 0)
  );
  readonly diferencia = computed(() =>
    this.filasCierre().reduce((sum, fila) => {
      const teorico = Number(fila.saldo.saldoActual ?? 0);
      return sum + (fila.valor - teorico);
    }, 0)
  );
  readonly tieneDiferencia = computed(() =>
    this.filasCierre().some(
      (fila) => Math.abs(fila.valor - Number(fila.saldo.saldoActual ?? 0)) > 0.009
    )
  );

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
          this.syncMedioAbono(data);
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

  abrirAperturaModal(): void {
    this.error.set(null);
    this.mensaje.set(null);
    this.observacionApertura = '';
    this.showAperturaModal.set(true);
    this.loadingMediosApertura.set(true);

    this.mediosCajaService.getAll(true).subscribe({
      next: (medios) => {
        this.filasApertura.set(
          (medios ?? []).map((medio) => ({
            medio,
            valor: 0,
            display: formatCurrencyCo(0),
          }))
        );
        this.loadingMediosApertura.set(false);
      },
      error: (err) => {
        this.loadingMediosApertura.set(false);
        this.error.set(this.extractErrorMessage(err, 'No se pudieron cargar los medios de pago.'));
      },
    });
  }

  cancelarAperturaModal(): void {
    this.showAperturaModal.set(false);
    this.filasApertura.set([]);
    this.observacionApertura = '';
  }

  abrirCaja(): void {
    const filas = this.filasApertura();
    if (filas.some((fila) => fila.valor < 0)) {
      this.error.set('Ningún saldo inicial puede ser negativo.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);

    this.cajaService
      .abrir({
        saldos: filas.map((fila) => ({
          medioCajaId: fila.medio.id,
          saldoInicial: fila.valor,
        })),
        observacion: this.observacionApertura.trim() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.saving.set(false);
          this.showAperturaModal.set(false);
          this.caja.set(data);
          this.syncMedioAbono(data);
          this.filasApertura.set([]);
          this.observacionApertura = '';
          this.mensaje.set('Caja abierta correctamente.');
          this.cargarHistorial();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(this.extractErrorMessage(err, 'No se pudo abrir la caja.'));
        },
      });
  }

  registrarAbono(): void {
    if (!this.caja()) return;

    if (this.montoAbono() <= 0) {
      this.error.set('El monto del abono debe ser mayor a cero.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);

    this.cajaService
      .abono({
        monto: this.montoAbono(),
        medioCajaId: this.medioAbonoId() ?? undefined,
        observacion: this.observacionAbono().trim() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.saving.set(false);
          this.caja.set(data);
          this.syncMedioAbono(data);
          this.setMontoAbono(0);
          this.observacionAbono.set('');
          this.mensaje.set('Abono registrado correctamente.');
          this.tabActiva.set('movimientos');
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(this.extractErrorMessage(err, 'No se pudo registrar el abono.'));
        },
      });
  }

  abrirCierreModal(): void {
    const actual = this.caja();
    if (!actual) return;

    this.error.set(null);
    this.filasCierre.set(
      (actual.saldos ?? []).map((saldo) => {
        const valor = Number(saldo.saldoActual ?? 0);
        return {
          saldo,
          valor,
          display: formatCurrencyCo(valor),
        };
      })
    );
    this.observacionCierre.set('');
    this.showCierreModal.set(true);
  }

  cancelarCierreModal(): void {
    this.showCierreModal.set(false);
    this.filasCierre.set([]);
  }

  confirmarCierreDesdeModal(): void {
    const actual = this.caja();
    if (!actual) return;

    const filas = this.filasCierre();
    if (!filas.length) {
      this.error.set('No hay medios de pago abiertos para cerrar.');
      return;
    }

    if (filas.some((fila) => fila.valor < 0)) {
      this.error.set('El saldo contado no puede ser negativo.');
      return;
    }

    if (this.tieneDiferencia() && !this.observacionCierre().trim()) {
      this.error.set(
        'Debe indicar una observación cuando el saldo contado de algún medio difiere del teórico.'
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
        message: `¿Cerrar la caja con ${filas.length} medios de pago (${diferenciaTexto})? No podrá registrar más movimientos en este turno.`,
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
            saldos: filas.map((fila) => ({
              medioCajaId: fila.saldo.medioCajaId,
              saldoCierre: fila.valor,
            })),
            observacion: this.observacionCierre().trim() || undefined,
          })
          .subscribe({
            next: (cerrada) => {
              this.imprimirCierre(cerrada);
              this.saving.set(false);
              this.showCierreModal.set(false);
              this.caja.set(null);
              this.filasCierre.set([]);
              this.observacionCierre.set('');
              this.medioAbonoId.set(null);
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

  onSaldoAperturaInput(medioId: number, event: Event): void {
    this.applyCurrencyInput(event, (value) => {
      this.filasApertura.update((filas) =>
        filas.map((fila) =>
          fila.medio.id === medioId
            ? { ...fila, valor: value, display: formatCurrencyCo(value) }
            : fila
        )
      );
    });
  }

  onSaldoCierreInput(medioId: number, event: Event): void {
    this.applyCurrencyInput(event, (value) => {
      this.filasCierre.update((filas) =>
        filas.map((fila) =>
          fila.saldo.medioCajaId === medioId
            ? { ...fila, valor: value, display: formatCurrencyCo(value) }
            : fila
        )
      );
    });
  }

  onMontoAbonoInput(event: Event): void {
    this.applyCurrencyInput(event, (value) => this.setMontoAbono(value));
  }

  onObservacionCierreChange(value: string): void {
    this.observacionCierre.set(value ?? '');
  }

  onObservacionAbonoChange(value: string): void {
    this.observacionAbono.set(value ?? '');
  }

  onMedioAbonoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.medioAbonoId.set(value ? Number(value) : null);
  }

  conceptoLabel(concepto: CajaMovimientoConcepto): string {
    return CAJA_CONCEPTO_LABEL[concepto] ?? concepto;
  }

  formatCurrency(value: number | null | undefined): string {
    return formatCurrencyCo(value ?? 0);
  }

  detalleMedio(medio: MedioCaja): string {
    return medioCajaDetalle(medio);
  }

  detalleSaldo(saldo: CajaSaldo): string {
    return saldo.detalle?.trim() || '';
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

  private setMontoAbono(value: number): void {
    this.montoAbono.set(value);
    this.montoAbonoDisplay.set(formatCurrencyCo(value));
  }

  private syncMedioAbono(caja: Caja): void {
    const saldos = caja.saldos ?? [];
    const actual = this.medioAbonoId();
    if (actual && saldos.some((saldo) => saldo.medioCajaId === actual)) {
      return;
    }
    const efectivo = saldos.find((saldo) => saldo.medioTipo === 'EFECTIVO');
    this.medioAbonoId.set(efectivo?.medioCajaId ?? saldos[0]?.medioCajaId ?? null);
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
      medios: (caja.saldos ?? []).map((saldo) => ({
        nombre: saldo.medioNombre,
        detalle: saldo.detalle,
        saldoTeorico: Number(saldo.saldoTeorico ?? saldo.saldoActual) || 0,
        saldoCierre: Number(saldo.saldoCierre ?? saldo.saldoActual) || 0,
        diferencia: Number(saldo.diferencia) || 0,
      })),
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
