import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ExistenciaProducto } from '../../core/models/inventario.model';
import {
  MovimientoInventario,
  RegistrarMovimientoRequest,
} from '../../core/models/movimiento-inventario.model';
import { Producto } from '../../core/models/producto.model';
import { InventarioService } from '../../core/services/inventario.service';
import { MovimientosInventarioService } from '../../core/services/movimientos-inventario.service';
import { ProductosService } from '../../core/services/productos.service';
import { RpConfirmDialogService } from '../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.scss',
})
export class MovimientosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly movimientosService = inject(MovimientosInventarioService);
  private readonly inventarioService = inject(InventarioService);
  private readonly productosService = inject(ProductosService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly existencias = signal<ExistenciaProducto[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly movimientos = signal<MovimientoInventario[]>([]);
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    productoOrigenId: [null as number | null, Validators.required],
    productoDestinoId: [null as number | null, Validators.required],
    cantidadKg: [null as number | null, [Validators.required, Validators.min(0.001)]],
    observacion: ['', Validators.maxLength(500)],
  });

  readonly formValue = signal(this.form.getRawValue());

  readonly origenesConStock = computed(() =>
    this.existencias().filter((item) => item.cantidadDisponible > 0)
  );

  readonly destinosDisponibles = computed(() => {
    const origenId = this.formValue().productoOrigenId;
    return this.productos().filter((producto) => producto.id !== origenId);
  });

  readonly existenciaOrigen = computed(() => {
    const origenId = this.formValue().productoOrigenId;
    if (origenId == null) {
      return null;
    }
    return this.existencias().find((item) => item.codigoProducto === origenId) ?? null;
  });

  readonly existenciaDestino = computed(() => {
    const destinoId = this.formValue().productoDestinoId;
    if (destinoId == null) {
      return null;
    }
    return this.existencias().find((item) => item.codigoProducto === destinoId) ?? null;
  });

  readonly movimientosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.movimientos();
    }
    return this.movimientos().filter((movimiento) => this.matchesSearch(movimiento, q));
  });

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const origenId = this.form.controls.productoOrigenId.value;
      if (this.form.controls.productoDestinoId.value === origenId) {
        this.form.controls.productoDestinoId.setValue(null, { emitEvent: false });
      }
      this.formValue.set(this.form.getRawValue());
    });
    this.loadData();
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const origenId = raw.productoOrigenId;
    const destinoId = raw.productoDestinoId;
    const cantidadKg = Number(raw.cantidadKg);
    if (origenId == null || destinoId == null || !Number.isFinite(cantidadKg) || cantidadKg <= 0) {
      this.form.markAllAsTouched();
      return;
    }

    const origen = this.nombreProducto(origenId);
    const destino = this.nombreProducto(destinoId);
    const disponible = this.existenciaOrigen()?.cantidadDisponible ?? 0;
    if (cantidadKg > disponible) {
      this.error.set(
        `Stock insuficiente de ${origen}. Disponible: ${this.formatPeso(disponible)} KG`
      );
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Confirmar movimiento',
        message: `¿Mover ${this.formatPeso(cantidadKg)} KG de ${origen} a ${destino}? Se actualizará el inventario.`,
        confirmLabel: 'Mover',
        cancelLabel: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.guardar({
          productoOrigenId: origenId,
          productoDestinoId: destinoId,
          cantidadKg,
          observacion: raw.observacion.trim() || undefined,
        });
      });
  }

  formatPeso(value: number | null | undefined): string {
    if (value == null) {
      return '—';
    }
    return value.toLocaleString('es-CL', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 3,
    });
  }

  nombreProducto(id: number | null): string {
    if (id == null) {
      return '—';
    }
    return (
      this.existencias().find((item) => item.codigoProducto === id)?.nombreProducto ??
      this.productos().find((item) => item.id === id)?.nombreInterno ??
      `Producto #${id}`
    );
  }

  private guardar(request: RegistrarMovimientoRequest): void {
    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);

    this.movimientosService.registrar(request).subscribe({
      next: (movimiento) => {
        this.saving.set(false);
        this.form.reset({
          productoOrigenId: null,
          productoDestinoId: null,
          cantidadKg: null,
          observacion: '',
        });
        this.mensaje.set(
          `Se movieron ${this.formatPeso(movimiento.cantidadKg)} KG de ${movimiento.productoOrigenNombre} a ${movimiento.productoDestinoNombre}.`
        );
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      existencias: this.inventarioService.getResumen(),
      productos: this.productosService.getActivos(),
      movimientos: this.movimientosService.getAll(),
    }).subscribe({
      next: ({ existencias, productos, movimientos }) => {
        this.existencias.set(existencias);
        this.productos.set(productos);
        this.movimientos.set(movimientos);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  private matchesSearch(movimiento: MovimientoInventario, q: string): boolean {
    const fields = [
      String(movimiento.id),
      movimiento.productoOrigenNombre,
      movimiento.productoDestinoNombre,
      movimiento.observacion,
      movimiento.usuarioRegistroNombre,
      movimiento.sucursalNombre,
    ];
    return fields.some((value) => value?.toLowerCase().includes(q));
  }

  private extractErrorMessage(err: {
    error?: { message?: string; errors?: Record<string, string> };
  }): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) {
        return first;
      }
    }
    return body?.message ?? 'Ocurrió un error al procesar el movimiento.';
  }
}
