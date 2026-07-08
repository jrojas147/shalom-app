import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { compraProveedorTipoLabel } from '../../core/models/compra-proveedor.model';
import {
  ExistenciaProducto,
  INVENTARIO_ESTADOS,
  InventarioEntrada,
  InventarioEstado,
  inventarioEstadoLabel,
} from '../../core/models/inventario.model';
import { InventarioService } from '../../core/services/inventario.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

type VistaInventario = 'resumen' | 'detalle';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [DatePipe, FormsModule, RpModalComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  private readonly inventarioService = inject(InventarioService);

  readonly inventarioEstados = INVENTARIO_ESTADOS;
  readonly inventarioEstadoLabel = inventarioEstadoLabel;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;

  readonly resumen = signal<ExistenciaProducto[]>([]);
  readonly entradas = signal<InventarioEntrada[]>([]);
  readonly busqueda = signal('');
  readonly estadoFiltro = signal<InventarioEstado | ''>('');
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
    () => this.entradas().filter((e) => e.estado === 'DISPONIBLE').length
  );

  readonly resumenFiltrado = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.resumen();
    }
    return this.resumen().filter((item) => this.matchesResumen(item, q));
  });

  readonly entradasFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.estadoFiltro();
    const productoId = this.productoFiltroId();

    return this.entradas().filter((entrada) => {
      if (productoId !== null && entrada.codigoProducto !== productoId) {
        return false;
      }
      if (estado && entrada.estado !== estado) {
        return false;
      }
      if (!q) {
        return true;
      }
      return this.matchesEntrada(entrada, q);
    });
  });

  readonly productoFiltroNombre = computed(() => {
    const id = this.productoFiltroId();
    if (id === null) {
      return null;
    }
    return (
      this.resumen().find((item) => item.codigoProducto === id)?.nombreProducto ??
      this.entradas().find((item) => item.codigoProducto === id)?.nombreProducto ??
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
      entradas: this.inventarioService.getAll(),
    }).subscribe({
      next: ({ resumen, entradas }) => {
        this.resumen.set(resumen);
        this.entradas.set(entradas);
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

  onEstadoFiltroChange(value: InventarioEstado | ''): void {
    this.estadoFiltro.set(value);
  }

  verEntradasProducto(item: ExistenciaProducto): void {
    this.productoFiltroId.set(item.codigoProducto);
    this.busqueda.set('');
    this.estadoFiltro.set('');
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

  private matchesEntrada(entrada: InventarioEntrada, q: string): boolean {
    const fields = [
      String(entrada.idInventario),
      String(entrada.codigoProducto),
      entrada.nombreProducto,
      entrada.estado,
      inventarioEstadoLabel(entrada.estado),
      entrada.ubicacion,
      compraProveedorTipoLabel(entrada.proveedorTipo),
      String(entrada.proveedorId),
      entrada.compraDetalleId ? String(entrada.compraDetalleId) : null,
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
