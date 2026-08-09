import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { compraProveedorTipoLabel } from '../../core/models/compra-proveedor.model';
import {
  ExistenciaProducto,
  InventarioEntrada,
  inventarioEstadoLabel,
} from '../../core/models/inventario.model';
import { InventarioService } from '../../core/services/inventario.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

type VistaInventario = 'resumen' | 'detalle';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [DatePipe, RpModalComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  private readonly inventarioService = inject(InventarioService);

  readonly inventarioEstadoLabel = inventarioEstadoLabel;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;

  readonly resumen = signal<ExistenciaProducto[]>([]);
  readonly movimientos = signal<InventarioEntrada[]>([]);
  readonly busqueda = signal('');
  readonly productoFiltroId = signal<number | null>(null);
  readonly vista = signal<VistaInventario>('resumen');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showDetalle = signal(false);
  readonly entradaSeleccionada = signal<InventarioEntrada | null>(null);

  readonly totalProductos = computed(() => this.resumen().length);

  readonly totalKgDisponible = computed(() =>
    this.resumen().reduce((acc, item) => acc + item.cantidadDisponible, 0)
  );

  readonly entradasDisponibles = computed(
    () => this.movimientos().filter((e) => e.estado === 'DISPONIBLE').length
  );

  readonly resumenFiltrado = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.resumen();
    }
    return this.resumen().filter((item) => this.matchesResumen(item, q));
  });

  readonly movimientosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const productoId = this.productoFiltroId();

    return this.movimientos().filter((movimiento) => {
      if (productoId !== null && movimiento.codigoProducto !== productoId) {
        return false;
      }
      if (!q) {
        return true;
      }
      return this.matchesMovimiento(movimiento, q);
    });
  });

  readonly productoFiltroNombre = computed(() => {
    const id = this.productoFiltroId();
    if (id === null) {
      return null;
    }
    return (
      this.resumen().find((item) => item.codigoProducto === id)?.nombreProducto ??
      this.movimientos().find((item) => item.codigoProducto === id)?.nombreProducto ??
      `Producto #${id}`
    );
  });

  ngOnInit(): void {
    this.loadInventario();
  }

  loadInventario(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      resumen: this.inventarioService.getResumen(),
      movimientos: this.inventarioService.getAll(),
    }).subscribe({
      next: ({ resumen, movimientos }) => {
        this.resumen.set(resumen);
        this.movimientos.set(movimientos);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  setVista(vista: VistaInventario): void {
    this.vista.set(vista);
    if (vista === 'resumen') {
      this.productoFiltroId.set(null);
    }
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  verMovimientosProducto(item: ExistenciaProducto): void {
    this.productoFiltroId.set(item.codigoProducto);
    this.busqueda.set('');
    this.vista.set('detalle');
  }

  limpiarFiltroProducto(): void {
    this.productoFiltroId.set(null);
  }

  openDetalle(entrada: InventarioEntrada): void {
    this.entradaSeleccionada.set(entrada);
    this.showDetalle.set(true);
  }

  cerrarDetalle(): void {
    this.showDetalle.set(false);
    this.entradaSeleccionada.set(null);
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) {
      return '—';
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
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

  proveedorResumen(entrada: InventarioEntrada): string {
    const tipo = compraProveedorTipoLabel(entrada.proveedorTipo);
    if (entrada.sucursalId) {
      return `${tipo} #${entrada.proveedorId} · Suc. ${entrada.sucursalId}`;
    }
    return `${tipo} #${entrada.proveedorId}`;
  }

  private matchesResumen(item: ExistenciaProducto, q: string): boolean {
    return (
      String(item.codigoProducto).includes(q) ||
      item.nombreProducto.toLowerCase().includes(q)
    );
  }

  private matchesMovimiento(movimiento: InventarioEntrada, q: string): boolean {
    const fields = [
      String(movimiento.idInventario),
      String(movimiento.codigoProducto),
      movimiento.nombreProducto,
      movimiento.estado,
      inventarioEstadoLabel(movimiento.estado),
      movimiento.ubicacion,
      compraProveedorTipoLabel(movimiento.proveedorTipo),
      String(movimiento.proveedorId),
      movimiento.compraDetalleId ? String(movimiento.compraDetalleId) : null,
    ];
    return fields.some((value) => value?.toLowerCase().includes(q));
  }

  private extractErrorMessage(err: {
    error?: { message?: string; errors?: Record<string, string> };
  }): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) return first;
    }
    return body?.message ?? 'Ocurrió un error al cargar el inventario.';
  }
}
