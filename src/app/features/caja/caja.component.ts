import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CAJA_CONCEPTO_LABEL,
  Caja,
  CajaMovimientoConcepto,
} from '../../core/models/caja.model';
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

  readonly caja = signal<Caja | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  saldoInicial = 0;
  observacionApertura = '';
  saldoCierre = 0;
  observacionCierre = '';

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
          this.saldoCierre = Number(data.saldoActual ?? 0);
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
          this.saldoCierre = Number(data.saldoActual ?? 0);
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

    this.confirmDialog
      .confirm({
        title: 'Cerrar caja',
        message: '¿Cerrar la caja actual? No podrá registrar más movimientos en este turno.',
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
            saldoCierre: this.saldoCierre,
            observacion: this.observacionCierre.trim() || undefined,
          })
          .subscribe({
            next: () => {
              this.saving.set(false);
              this.caja.set(null);
              this.saldoInicial = 0;
              this.saldoCierre = 0;
              this.observacionCierre = '';
              this.mensaje.set('Caja cerrada correctamente.');
            },
            error: (err) => {
              this.saving.set(false);
              this.error.set(this.extractErrorMessage(err, 'No se pudo cerrar la caja.'));
            },
          });
      });
  }

  conceptoLabel(concepto: CajaMovimientoConcepto): string {
    return CAJA_CONCEPTO_LABEL[concepto] ?? concepto;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
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
