import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CodigoCiiu } from '../../core/models/codigo-ciiu.model';
import { compraProveedorTipoLabel } from '../../core/models/compra-proveedor.model';
import {
  ExistenciaProducto,
  InventarioConsolidadoSui,
  InventarioEntrada,
  inventarioEstadoLabel,
} from '../../core/models/inventario.model';
import { Producto, productoIdVisible } from '../../core/models/producto.model';
import { CodigosCiiuService } from '../../core/services/codigos-ciiu.service';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductosService } from '../../core/services/productos.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';
import { InventarioCierreMesComponent } from './inventario-cierre-mes/inventario-cierre-mes.component';

type VistaInventario = 'resumen' | 'detalle' | 'cierre' | 'consolidado';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [DatePipe, RpModalComponent, InventarioCierreMesComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  private readonly inventarioService = inject(InventarioService);
  private readonly productosService = inject(ProductosService);
  private readonly codigosCiiuService = inject(CodigosCiiuService);

  readonly inventarioEstadoLabel = inventarioEstadoLabel;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;

  readonly resumen = signal<ExistenciaProducto[]>([]);
  readonly movimientos = signal<InventarioEntrada[]>([]);
  readonly busqueda = signal('');
  readonly productoFiltroId = signal<number | null>(null);
  readonly codigoCiiuFiltro = signal<number | null>(null);
  readonly codigosCiiu = signal<CodigoCiiu[]>([]);
  readonly productosById = signal<Map<number, Producto>>(new Map());
  readonly vista = signal<VistaInventario>('resumen');
  readonly cierreRefresh = signal(0);
  readonly consolidado = signal<InventarioConsolidadoSui | null>(null);
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
    const ciiuId = this.codigoCiiuFiltro();
    return this.resumen().filter((item) => {
      if (!this.matchesSui(item.codigoProducto, ciiuId)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return this.matchesResumen(item, q);
    });
  });

  readonly movimientosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const productoId = this.productoFiltroId();
    const ciiuId = this.codigoCiiuFiltro();

    return this.movimientos().filter((movimiento) => {
      if (productoId !== null && movimiento.codigoProducto !== productoId) {
        return false;
      }
      if (!this.matchesSui(movimiento.codigoProducto, ciiuId)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return this.matchesMovimiento(movimiento, q);
    });
  });

  readonly consolidadoFiltrado = computed(() => {
    const data = this.consolidado();
    if (!data) {
      return [];
    }
    const q = this.busqueda().trim().toLowerCase();
    const ciiuId = this.codigoCiiuFiltro();
    const codigoFiltro =
      ciiuId == null ? null : this.codigosCiiu().find((item) => item.id === ciiuId)?.codigo ?? null;
    return data.items.filter((item) => {
      if (ciiuId !== null && item.codigoSui !== codigoFiltro) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        item.codigoSui.toLowerCase().includes(q) || item.nombreSui.toLowerCase().includes(q)
      );
    });
  });

  readonly consolidadoTotales = computed(() =>
    this.consolidadoFiltrado().reduce(
      (acc, item) => ({
        saldoKg: acc.saldoKg + Number(item.saldoKg || 0),
        compraKg: acc.compraKg + Number(item.compraKg || 0),
        ventaKg: acc.ventaKg + Number(item.ventaKg || 0),
        stockKg: acc.stockKg + Number(item.stockKg || 0),
      }),
      { saldoKg: 0, compraKg: 0, ventaKg: 0, stockKg: 0 }
    )
  );

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
    this.loadFiltroSui();
    this.loadInventario();
  }

  loadInventario(): void {
    if (this.vista() === 'cierre') {
      this.cierreRefresh.update((value) => value + 1);
      return;
    }
    if (this.vista() === 'consolidado') {
      this.loadConsolidado();
      return;
    }

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
    if (vista === 'consolidado' && !this.consolidado()) {
      this.loadConsolidado();
    }
  }

  loadConsolidado(): void {
    this.loading.set(true);
    this.error.set(null);
    this.inventarioService.getConsolidadoSui().subscribe({
      next: (data) => {
        this.consolidado.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  onCodigoCiiuFiltro(value: string): void {
    if (!value) {
      this.codigoCiiuFiltro.set(null);
      return;
    }
    const parsed = Number(value);
    this.codigoCiiuFiltro.set(Number.isFinite(parsed) ? parsed : null);
  }

  idProductoVisible(codigoProducto: number): string {
    const producto = this.productosById().get(codigoProducto);
    if (!producto) {
      return String(codigoProducto);
    }
    return productoIdVisible(producto.codigoCiiu, producto.idInterno);
  }

  nombreSui(codigoProducto: number): string {
    const producto = this.productosById().get(codigoProducto);
    const nombre = producto?.nombreCiiu?.trim();
    if (nombre) {
      return nombre;
    }
    const codigo = producto?.codigoCiiu?.trim();
    return codigo || '—';
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

  formatUnidades(value: number | null | undefined): string {
    const unidades = Number(value);
    return Number.isFinite(unidades) && unidades > 0 ? String(Math.trunc(unidades)) : '—';
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
    const nombre = entrada.proveedorNombre?.trim();
    if (nombre) {
      if (entrada.sucursalNombre?.trim()) {
        return `${nombre} · ${entrada.sucursalNombre.trim()}`;
      }
      return nombre;
    }
    const tipo = compraProveedorTipoLabel(entrada.proveedorTipo);
    if (entrada.sucursalId) {
      return `${tipo} #${entrada.proveedorId} · Suc. ${entrada.sucursalId}`;
    }
    return `${tipo} #${entrada.proveedorId}`;
  }

  tipoMovimiento(entrada: InventarioEntrada): 'ENTRADA' | 'SALIDA' {
    if (
      entrada.fechaSalida ||
      entrada.estado === 'AGOTADO' ||
      entrada.estado === 'SALIDA'
    ) {
      return 'SALIDA';
    }
    return 'ENTRADA';
  }

  tipoMovimientoLabel(entrada: InventarioEntrada): string {
    return this.tipoMovimiento(entrada) === 'SALIDA' ? 'Salida' : 'Entrada';
  }

  private matchesSui(codigoProducto: number, ciiuId: number | null): boolean {
    if (ciiuId == null) {
      return true;
    }
    return this.productosById().get(codigoProducto)?.codigoCiiuId === ciiuId;
  }

  private matchesResumen(item: ExistenciaProducto, q: string): boolean {
    return (
      this.idProductoVisible(item.codigoProducto).toLowerCase().includes(q) ||
      this.nombreSui(item.codigoProducto).toLowerCase().includes(q) ||
      item.nombreProducto.toLowerCase().includes(q)
    );
  }

  private matchesMovimiento(movimiento: InventarioEntrada, q: string): boolean {
    const fields = [
      String(movimiento.idInventario),
      this.idProductoVisible(movimiento.codigoProducto),
      this.nombreSui(movimiento.codigoProducto),
      movimiento.nombreProducto,
      movimiento.estado,
      inventarioEstadoLabel(movimiento.estado),
      this.tipoMovimientoLabel(movimiento),
      movimiento.ubicacion,
      compraProveedorTipoLabel(movimiento.proveedorTipo),
      movimiento.proveedorNombre,
      movimiento.sucursalNombre,
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

  private loadFiltroSui(): void {
    this.codigosCiiuService.getAll().subscribe({
      next: (data) => this.codigosCiiu.set(data ?? []),
      error: () => this.codigosCiiu.set([]),
    });
    this.productosService.getAll().subscribe({
      next: (data) => {
        const mapa = new Map<number, Producto>();
        for (const producto of data ?? []) {
          mapa.set(producto.id, producto);
        }
        this.productosById.set(mapa);
      },
      error: () => this.productosById.set(new Map()),
    });
  }
}
