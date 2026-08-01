import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  CompraDetalleItem,
  EMPAQUE_OPCIONES,
  EmpaqueTipo,
} from '../../core/models/compra.model';
import { CodigoCiiu } from '../../core/models/codigo-ciiu.model';
import {
  Producto,
  productoImagenUrl,
} from '../../core/models/producto.model';
import { tipoClienteLabel } from '../../core/models/cliente.model';
import {
  VentaClienteSeleccion,
  ventaClienteEtiqueta,
} from '../../core/models/venta.model';
import { CodigosCiiuService } from '../../core/services/codigos-ciiu.service';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductosService } from '../../core/services/productos.service';
import { VentasService } from '../../core/services/ventas.service';
import { VentaClienteModalComponent } from './venta-cliente-modal/venta-cliente-modal.component';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [FormsModule, VentaClienteModalComponent],
  templateUrl: './venta.component.html',
  styleUrl: '../compras/compras.component.scss',
})
export class VentaComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly inventarioService = inject(InventarioService);
  private readonly codigosCiiuService = inject(CodigosCiiuService);
  private readonly ventasService = inject(VentasService);

  readonly ventaClienteEtiqueta = ventaClienteEtiqueta;
  readonly tipoClienteLabel = tipoClienteLabel;
  readonly empaqueOpciones = EMPAQUE_OPCIONES;
  readonly productoImagenUrl = productoImagenUrl;

  readonly productos = signal<Producto[]>([]);
  readonly existencias = signal<Map<number, number>>(new Map());
  readonly codigosCiiu = signal<CodigoCiiu[]>([]);
  readonly items = signal<CompraDetalleItem[]>([]);
  readonly clienteSeleccionado = signal<VentaClienteSeleccion | null>(null);
  readonly busqueda = signal('');
  readonly codigoCiiuFiltro = signal<number | null>(null);
  readonly loading = signal(false);
  readonly showClienteModal = signal(false);
  readonly procesando = signal(false);
  readonly mensaje = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly factura = signal('—');

  readonly productosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const ciiuId = this.codigoCiiuFiltro();
    const stock = this.existencias();

    return this.productos().filter((p) => {
      const disponible = stock.get(p.id) ?? 0;
      if (disponible <= 0) {
        return false;
      }
      const matchCiiu = ciiuId == null || p.codigoCiiuId === ciiuId;
      if (!matchCiiu) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        p.nombreInterno.toLowerCase().includes(q) ||
        (p.nombreCiiu?.toLowerCase().includes(q) ?? false) ||
        (p.codigoCiiu?.toLowerCase().includes(q) ?? false)
      );
    });
  });

  readonly cantidadItems = computed(() => this.items().length);

  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + this.itemTotal(item), 0)
  );

  readonly pesoTotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.pesoKg, 0)
  );

  readonly puedeRegistrarVenta = computed(
    () => !!this.clienteSeleccionado() && this.items().length > 0
  );

  ngOnInit(): void {
    this.loading.set(true);

    forkJoin({
      productos: this.productosService.getActivos(),
      existencias: this.inventarioService.getResumen(),
    }).subscribe({
      next: ({ productos, existencias }) => {
        const map = new Map<number, number>();
        for (const item of existencias) {
          map.set(item.codigoProducto, Number(item.cantidadDisponible) || 0);
        }
        this.existencias.set(map);
        this.productos.set(productos);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos con inventario.');
        this.loading.set(false);
      },
    });

    this.codigosCiiuService.getAll().subscribe({
      next: (data) => this.codigosCiiu.set(data),
      error: () => this.codigosCiiu.set([]),
    });
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
  }

  onCodigoCiiuFiltro(value: number | null): void {
    this.codigoCiiuFiltro.set(value);
  }

  stockProducto(productoId: number): number {
    return this.existencias().get(productoId) ?? 0;
  }

  precioVentaKg(producto: Producto): number {
    return producto.precioVenta ?? 0;
  }

  agregarProducto(producto: Producto): void {
    const stock = this.stockProducto(producto.id);
    if (stock <= 0) {
      this.error.set(`Sin stock disponible para ${producto.nombreInterno}.`);
      return;
    }

    const existente = this.items().find((i) => i.productoId === producto.id);
    if (existente) {
      this.ajustarPeso(producto.id, 0.5);
      return;
    }

    const nuevo: CompraDetalleItem = {
      productoId: producto.id,
      producto,
      pesoKg: Math.min(1, stock),
      empaque: 'Globo Grande',
    };
    this.items.update((list) => [...list, nuevo]);
    this.mensaje.set(null);
    this.error.set(null);
  }

  ajustarPeso(productoId: number, delta: number): void {
    const stock = this.stockProducto(productoId);
    this.items.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        const peso = Math.max(0.5, Math.round((item.pesoKg + delta) * 2) / 2);
        return { ...item, pesoKg: Math.min(peso, stock) };
      })
    );
  }

  onPesoInput(productoId: number, value: string): void {
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed < 0.5) return;
    const stock = this.stockProducto(productoId);
    this.items.update((list) =>
      list.map((item) =>
        item.productoId === productoId
          ? { ...item, pesoKg: Math.min(parsed, stock) }
          : item
      )
    );
  }

  setEmpaque(productoId: number, empaque: EmpaqueTipo): void {
    this.items.update((list) =>
      list.map((item) =>
        item.productoId === productoId ? { ...item, empaque } : item
      )
    );
  }

  eliminarItem(productoId: number): void {
    this.items.update((list) => list.filter((i) => i.productoId !== productoId));
  }

  abrirModalCliente(): void {
    this.showClienteModal.set(true);
  }

  cerrarModalCliente(): void {
    this.showClienteModal.set(false);
  }

  seleccionarCliente(cliente: VentaClienteSeleccion): void {
    this.clienteSeleccionado.set(cliente);
    this.showClienteModal.set(false);
    this.error.set(null);
  }

  itemTotal(item: CompraDetalleItem): number {
    return item.pesoKg * this.precioVentaKg(item.producto);
  }

  formatPrecioKg(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatPeso(value: number): string {
    return value.toLocaleString('es-CL', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    });
  }

  productoIcono(): string {
    return '📦';
  }

  registrarVenta(): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente) {
      this.error.set('Seleccione un cliente para continuar.');
      this.abrirModalCliente();
      return;
    }
    if (this.items().length === 0) {
      this.error.set('Agregue al menos un producto a la venta.');
      return;
    }

    for (const item of this.items()) {
      const stock = this.stockProducto(item.productoId);
      if (item.pesoKg > stock) {
        this.error.set(
          `Stock insuficiente para ${item.producto.nombreInterno}. Disponible: ${this.formatPeso(stock)} KG`
        );
        return;
      }
    }

    this.procesando.set(true);
    this.error.set(null);

    this.ventasService
      .registrar({
        cliente,
        items: this.items(),
        total: this.subtotal(),
        pesoTotal: this.pesoTotal(),
      })
      .subscribe({
        next: (res) => {
          this.procesando.set(false);
          this.factura.set(res.factura);
          this.mensaje.set(res.mensaje);
          this.items.set([]);
          this.clienteSeleccionado.set(null);
          this.recargarExistencias();
        },
        error: (err) => {
          this.procesando.set(false);
          this.error.set(this.extractErrorMessage(err));
        },
      });
  }

  private recargarExistencias(): void {
    this.inventarioService.getResumen().subscribe({
      next: (existencias) => {
        const map = new Map<number, number>();
        for (const item of existencias) {
          map.set(item.codigoProducto, Number(item.cantidadDisponible) || 0);
        }
        this.existencias.set(map);
      },
    });
  }

  private extractErrorMessage(err: {
    error?: { message?: string; errors?: Record<string, string> };
  }): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) return first;
    }
    return body?.message ?? 'No se pudo registrar la venta.';
  }
}
