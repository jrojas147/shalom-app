import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CajaSaldo } from '../../core/models/caja.model';
import { SiigoProveedor } from '../../core/models/configuracion-siigo.model';
import { Gasto } from '../../core/models/gasto.model';
import { TipoGasto } from '../../core/models/tipo-gasto.model';
import { CajaService } from '../../core/services/caja.service';
import { ConfiguracionSiigoService } from '../../core/services/configuracion-siigo.service';
import { GastosService } from '../../core/services/gastos.service';
import { TiposGastoService } from '../../core/services/tipos-gasto.service';
import {
  formatCurrencyCo,
  parseCurrencyCo,
  resolveCurrencyCoCursor,
} from '../../core/utils/currency.util';
import { RpConfirmDialogService } from '../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.scss',
})
export class GastosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly gastosService = inject(GastosService);
  private readonly tiposGastoService = inject(TiposGastoService);
  private readonly cajaService = inject(CajaService);
  private readonly configuracionSiigoService = inject(ConfiguracionSiigoService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly tiposGasto = signal<TipoGasto[]>([]);
  readonly saldosCaja = signal<CajaSaldo[]>([]);
  readonly gastos = signal<Gasto[]>([]);
  readonly cajaAbierta = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly proveedoresSiigo = signal<SiigoProveedor[]>([]);
  readonly loadingProveedores = signal(false);
  readonly montoDisplay = signal(formatCurrencyCo(0));

  readonly form = this.fb.nonNullable.group({
    tipoGastoId: [null as number | null, Validators.required],
    medioCajaId: [null as number | null, Validators.required],
    terceroKey: ['', Validators.required],
    monto: [0, [Validators.required, Validators.min(1)]],
    observacion: ['', Validators.maxLength(500)],
  });

  readonly formValue = signal(this.form.getRawValue());

  readonly gastosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.gastos();
    }
    return this.gastos().filter((gasto) => {
      const haystack = [
        gasto.tipoGastoNombre,
        gasto.medioCajaNombre,
        gasto.observacion,
        gasto.usuarioRegistroNombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  readonly medioSeleccionado = computed(() => {
    const id = this.formValue().medioCajaId;
    return this.saldosCaja().find((saldo) => saldo.medioCajaId === id) ?? null;
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.formValue.set(this.form.getRawValue()));
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tiposGastoService.getAll(true).subscribe({
      next: (data) => {
        const vigentes = (data ?? []).filter((tipo) => tipo.activo);
        this.tiposGasto.set(vigentes);
        const actual = this.form.controls.tipoGastoId.value;
        if (!actual || !vigentes.some((tipo) => tipo.id === actual)) {
          const general = vigentes.find((tipo) => tipo.sistema) ?? vigentes[0];
          this.form.controls.tipoGastoId.setValue(general?.id ?? null);
        }
      },
      error: (err) =>
        this.error.set(err.error?.message ?? 'No se pudieron cargar los tipos de gasto.'),
    });

    this.loadingProveedores.set(true);
    this.configuracionSiigoService.proveedores().subscribe({
      next: (data) => {
        const lista = data ?? [];
        this.proveedoresSiigo.set(lista);
        this.loadingProveedores.set(false);
        const actual = this.form.controls.terceroKey.value;
        if (actual && !lista.some((item) => this.proveedorKey(item) === actual)) {
          this.form.controls.terceroKey.setValue('');
        }
      },
      error: (err) => {
        this.proveedoresSiigo.set([]);
        this.loadingProveedores.set(false);
        this.error.set(this.extractErrorMessage(err, 'No se pudieron cargar los proveedores de Siigo.'));
      },
    });

    this.cajaService.obtenerActual().subscribe({
      next: (caja) => {
        if (caja) {
          this.cajaAbierta.set(true);
          const saldos = caja.saldos ?? [];
          this.saldosCaja.set(saldos);
          this.form.controls.medioCajaId.enable({ emitEvent: false });
          const actual = this.form.controls.medioCajaId.value;
          if (!actual || !saldos.some((saldo) => saldo.medioCajaId === actual)) {
            const efectivo = saldos.find((saldo) => saldo.medioTipo === 'EFECTIVO');
            this.form.controls.medioCajaId.setValue(
              efectivo?.medioCajaId ?? saldos[0]?.medioCajaId ?? null
            );
          }
        } else {
          this.cajaAbierta.set(false);
          this.saldosCaja.set([]);
          this.form.controls.medioCajaId.setValue(null);
          this.form.controls.medioCajaId.disable({ emitEvent: false });
        }
      },
      error: () => {
        this.cajaAbierta.set(false);
        this.saldosCaja.set([]);
      },
    });

    this.gastosService.listar().subscribe({
      next: (data) => {
        this.gastos.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'No se pudieron cargar los gastos.');
      },
    });
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  onMontoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectionStart = input.selectionStart ?? input.value.length;
    const digitsBefore = input.value.slice(0, selectionStart).replace(/\D/g, '').length;
    const parsed = parseCurrencyCo(input.value) ?? 0;
    const formatted = formatCurrencyCo(parsed);
    this.form.controls.monto.setValue(parsed);
    this.montoDisplay.set(formatted);
    input.value = formatted;
    const cursor = resolveCurrencyCoCursor(formatted, digitsBefore);
    requestAnimationFrame(() => input.setSelectionRange(cursor, cursor));
  }

  registrar(): void {
    if (!this.cajaAbierta()) {
      this.error.set('Debe abrir la caja antes de registrar un gasto.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const medio = this.saldosCaja().find((saldo) => saldo.medioCajaId === raw.medioCajaId);
    if (medio && Number(medio.saldoActual ?? 0) < raw.monto) {
      this.error.set(
        `Saldo insuficiente en ${medio.medioNombre}. Disponible: ${this.formatCurrency(medio.saldoActual)}.`
      );
      return;
    }

    const proveedor = this.proveedoresSiigo().find(
      (item) => this.proveedorKey(item) === raw.terceroKey
    );
    if (!proveedor) {
      this.error.set('Seleccione un proveedor de Siigo.');
      return;
    }

    this.error.set(null);
    const tipo = this.tiposGasto().find((item) => item.id === raw.tipoGastoId);
    this.confirmDialog
      .confirm({
        title: 'Registrar gasto',
        message: `¿Registrar ${this.formatCurrency(raw.monto)} en ${tipo?.nombre ?? 'gasto'} desde ${medio?.medioNombre ?? 'caja'} a nombre de ${proveedor.nombre}?`,
        confirmLabel: 'Registrar',
        cancelLabel: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.saving.set(true);
        this.error.set(null);
        this.mensaje.set(null);

        this.gastosService
          .registrar({
            tipoGastoId: raw.tipoGastoId!,
            medioCajaId: raw.medioCajaId!,
            monto: raw.monto,
            observacion: raw.observacion.trim() || undefined,
            terceroIdentificacion: proveedor.identificacion,
            terceroNombre: proveedor.nombre,
            terceroSucursal: proveedor.sucursal ?? 0,
          })
          .subscribe({
            next: (gasto) => {
              this.saving.set(false);
              this.mensaje.set(gasto.mensaje || 'Gasto registrado y descontado de caja.');
              this.form.patchValue({ monto: 0, observacion: '', terceroKey: '' });
              this.montoDisplay.set(formatCurrencyCo(0));
              this.loadAll();
            },
            error: (err) => {
              this.saving.set(false);
              this.error.set(this.extractErrorMessage(err, 'No se pudo registrar el gasto.'));
            },
          });
      });
  }

  proveedorKey(item: SiigoProveedor): string {
    return `${item.identificacion}|${item.sucursal ?? 0}`;
  }

  etiquetaProveedor(item: SiigoProveedor): string {
    const sucursal = item.sucursal > 0 ? ` — sucursal ${item.sucursal}` : '';
    return `${item.nombre} — ${item.identificacion}${sucursal}`;
  }

  formatCurrency(value: number | null | undefined): string {
    return formatCurrencyCo(value ?? 0);
  }

  private extractErrorMessage(
    err: { error?: { message?: string; errors?: Record<string, string> } },
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
