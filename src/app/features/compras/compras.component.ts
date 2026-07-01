import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CompraProveedorSeleccion,
  compraProveedorEtiqueta,
  compraProveedorTipoLabel,
} from '../../core/models/compra-proveedor.model';
import {
  CompraDetalleItem,
  EMPAQUE_OPCIONES,
  EmpaqueTipo,
} from '../../core/models/compra.model';
import {
  Producto,
  productoImagenUrl,
  productoPrecioKg,
} from '../../core/models/producto.model';
import { CodigoCiiu } from '../../core/models/codigo-ciiu.model';
import { AuthService } from '../../core/services/auth.service';
import { CodigosCiiuService } from '../../core/services/codigos-ciiu.service';
import { CompraFacturaPrintService } from '../../core/services/compra-factura-print.service';
import { ComprasService } from '../../core/services/compras.service';
import { ProductosService } from '../../core/services/productos.service';
import { CompraProveedorModalComponent } from './compra-proveedor-modal/compra-proveedor-modal.component';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [FormsModule, CompraProveedorModalComponent],
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.scss',
})
export class ComprasComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly codigosCiiuService = inject(CodigosCiiuService);
  private readonly comprasService = inject(ComprasService);
  private readonly auth = inject(AuthService);
  private readonly facturaPrintService = inject(CompraFacturaPrintService);

  readonly compraProveedorEtiqueta = compraProveedorEtiqueta;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;
  readonly empaqueOpciones = EMPAQUE_OPCIONES;
  readonly productoPrecioKg = productoPrecioKg;
  readonly productoImagenUrl = productoImagenUrl;

  readonly productos = signal<Producto[]>([]);
  readonly codigosCiiu = signal<CodigoCiiu[]>([]);
  readonly items = signal<CompraDetalleItem[]>([]);
  readonly proveedorSeleccionado = signal<CompraProveedorSeleccion | null>(null);
  readonly busqueda = signal('');
  readonly codigoCiiuFiltro = signal<number | null>(null);
  readonly loading = signal(false);
  readonly showProveedorModal = signal(false);
  readonly procesando = signal(false);
  readonly mensaje = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly factura = signal('0042');

  readonly productosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const ciiuId = this.codigoCiiuFiltro();
    return this.productos().filter((p) => {
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

  ngOnInit(): void {
    this.loading.set(true);
    this.productosService.getActivos().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos.');
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

  agregarProducto(producto: Producto): void {
    const existente = this.items().find((i) => i.productoId === producto.id);
    if (existente) {
      this.ajustarPeso(producto.id, 0.5);
      return;
    }

    const nuevo: CompraDetalleItem = {
      productoId: producto.id,
      producto,
      pesoKg: 1,
      empaque: 'Globo Grande',
    };
    this.items.update((list) => [...list, nuevo]);
    this.mensaje.set(null);
  }

  ajustarPeso(productoId: number, delta: number): void {
    this.items.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        const peso = Math.max(0.5, Math.round((item.pesoKg + delta) * 2) / 2);
        return { ...item, pesoKg: peso };
      })
    );
  }

  onPesoInput(productoId: number, value: string): void {
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed < 0.5) return;
    this.items.update((list) =>
      list.map((item) =>
        item.productoId === productoId ? { ...item, pesoKg: parsed } : item
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

  abrirModalProveedor(): void {
    this.showProveedorModal.set(true);
  }

  cerrarModalProveedor(): void {
    this.showProveedorModal.set(false);
  }

  seleccionarProveedor(proveedor: CompraProveedorSeleccion): void {
    this.proveedorSeleccionado.set(proveedor);
    this.showProveedorModal.set(false);
    this.error.set(null);
  }

  itemTotal(item: CompraDetalleItem): number {
    return item.pesoKg * productoPrecioKg(item.producto);
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

  empaqueLabel(empaque: EmpaqueTipo): string {
    return this.empaqueOpciones.find((o) => o.value === empaque)?.label ?? empaque;
  }

  productoIcono(): string {
    return '📦';
  }

  procesarPago(): void {
    const proveedor = this.proveedorSeleccionado();
    if (!proveedor) {
      this.error.set('Seleccione un proveedor para continuar.');
      this.abrirModalProveedor();
      return;
    }
    if (this.items().length === 0) {
      this.error.set('Agregue al menos un producto a la compra.');
      return;
    }

    this.procesando.set(true);
    this.error.set(null);

    const proveedorSnapshot = { ...proveedor };
    const itemsSnapshot = this.items().map((item) => ({
      ...item,
      producto: { ...item.producto },
    }));
    const totalSnapshot = this.subtotal();
    const pesoSnapshot = this.pesoTotal();

    this.comprasService
      .procesar({
        proveedor: proveedorSnapshot,
        items: itemsSnapshot,
        total: totalSnapshot,
        pesoTotal: pesoSnapshot,
      })
      .subscribe({
        next: (res) => {
          this.procesando.set(false);
          this.factura.set(res.factura);
          this.mensaje.set(res.mensaje);
          this.imprimirFactura(res.factura, proveedorSnapshot, itemsSnapshot, totalSnapshot, pesoSnapshot);
          this.items.set([]);
        },
        error: () => {
          this.procesando.set(false);
          this.error.set('No se pudo procesar la compra.');
        },
      });
  }

  private imprimirFactura(
    factura: string,
    proveedor: CompraProveedorSeleccion,
    items: CompraDetalleItem[],
    total: number,
    pesoTotal: number
  ): void {
    const user = this.auth.currentUser();
    const nombreUsuario = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();

    this.facturaPrintService.imprimir({
      factura,
      fecha: new Date(),
      comercioNombre: user?.comercioNombre ?? 'Comercio',
      usuarioNombre: nombreUsuario || user?.username || 'Usuario',
      usuarioUsername: user?.username ?? '',
      proveedor,
      items: items.map((item) => ({
        nombre: item.producto.nombreInterno,
        pesoKg: item.pesoKg,
        precioKg: productoPrecioKg(item.producto),
        total: this.itemTotal(item),
        empaque: this.empaqueLabel(item.empaque),
      })),
      total,
      pesoTotal,
    });
  }
}
