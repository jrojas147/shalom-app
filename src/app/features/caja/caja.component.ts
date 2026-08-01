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

  readonly caja = signal<Caja | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly saldoCierre = signal(0);
  readonly observacionCierre = signal('');

  saldoInicial = 0;
  observacionApertura = '';

  readonly saldoTeorico = computed(() =>
    Number(this.caja()?.saldoTeorico ?? this.caja()?.saldoActual ?? 0)
  );
  readonly diferencia = computed(() => this.saldoCierre() - this.saldoTeorico());
  readonly tieneDiferencia = computed(() => Math.abs(this.diferencia()) > 0.009);

  ngOnInit(): void {
    this.cargarCaja();
  }

  cargarCaja(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cajaService.obtenerActual().subscribe({
      next: (data) => {
        this.caja.set(data);
        if (data) {
          this.saldoCierre.set(Number(data.saldoActual ?? 0));
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
          this.saldoCierre.set(Number(data.saldoActual ?? 0));
          this.mensaje.set('Caja abierta correctamente.');
          this.observacionApertura = '';
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
              this.saldoInicial = 0;
              this.saldoCierre.set(0);
              this.observacionCierre.set('');
              this.mensaje.set('Caja cerrada correctamente. Se generó el comprobante de cierre.');
            },
            error: (err) => {
              this.saving.set(false);
              this.error.set(this.extractErrorMessage(err, 'No se pudo cerrar la caja.'));
            },
          });
      });
  }

  usarSaldoTeorico(): void {
    this.saldoCierre.set(this.saldoTeorico());
  }

  onSaldoCierreChange(value: number | string | null): void {
    this.saldoCierre.set(Number(value) || 0);
  }

  onObservacionCierreChange(value: string): void {
    this.observacionCierre.set(value ?? '');
  }

  conceptoLabel(concepto: CajaMovimientoConcepto): string {
    return CAJA_CONCEPTO_LABEL[concepto] ?? concepto;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
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
