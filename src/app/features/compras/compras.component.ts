import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CompraProveedorSeleccion,
  compraProveedorEtiqueta,
  compraProveedorTipoLabel,
} from '../../core/models/compra-proveedor.model';
import { CompraDetalleItem, EmpaqueTipo } from '../../core/models/compra.model';
import {
  Producto,
  productoImagenUrl,
  productoPrecioKg,
} from '../../core/models/producto.model';
import { CodigoCiiu } from '../../core/models/codigo-ciiu.model';
import { TipoEmpaque } from '../../core/models/tipo-empaque.model';
import { AuthService } from '../../core/services/auth.service';
import { CodigosCiiuService } from '../../core/services/codigos-ciiu.service';
import { CompraFacturaPrintService } from '../../core/services/compra-factura-print.service';
import { ComprasService } from '../../core/services/compras.service';
import { ProductosService } from '../../core/services/productos.service';
import { TiposEmpaqueService } from '../../core/services/tipos-empaque.service';
import { pesoEmpaqueKg, pesoNetoKg } from '../../core/utils/empaque-peso.util';
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
  private readonly tiposEmpaqueService = inject(TiposEmpaqueService);
  private readonly comprasService = inject(ComprasService);
  private readonly auth = inject(AuthService);
  private readonly facturaPrintService = inject(CompraFacturaPrintService);

  readonly compraProveedorEtiqueta = compraProveedorEtiqueta;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;
  readonly productoPrecioKg = productoPrecioKg;
  readonly productoImagenUrl = productoImagenUrl;

  readonly productos = signal<Producto[]>([]);
  readonly codigosCiiu = signal<CodigoCiiu[]>([]);
  readonly tiposEmpaque = signal<TipoEmpaque[]>([]);
  readonly items = signal<CompraDetalleItem[]>([]);
  readonly proveedorSeleccionado = signal<CompraProveedorSeleccion | null>(null);
  readonly busqueda = signal('');
  readonly codigoCiiuFiltro = signal<number | null>(null);
  readonly loading = signal(false);
  readonly showProveedorModal = signal(false);
  readonly procesando = signal(false);
  readonly mensaje = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly factura = signal('—');

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

  readonly pesoBrutoTotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.pesoKg, 0)
  );

  readonly pesoNetoTotal = computed(() =>
    this.items().reduce((sum, item) => sum + this.pesoNetoItem(item), 0)
  );

  readonly puedeRegistrarPreCompra = computed(
    () => !!this.proveedorSeleccionado() && this.items().length > 0
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

    this.tiposEmpaqueService.getAll().subscribe({
      next: (data) => this.tiposEmpaque.set(data),
      error: () => this.tiposEmpaque.set([]),
    });
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
  }

  onCodigoCiiuFiltro(value: number | null): void {
    this.codigoCiiuFiltro.set(value);
  }

  agregarProducto(producto: Producto): void {
    if (this.tiposEmpaque().length === 0) {
      this.error.set(
        'No hay tipos de empaque parametrizados. Configure al menos uno en Parametrización.'
      );
      return;
    }

    const existente = this.items().find((i) => i.productoId === producto.id);
    if (existente) {
      this.ajustarPeso(producto.id, 0.5);
      return;
    }

    const empaque = this.empaquePorDefecto();
    const tara = pesoEmpaqueKg(this.tiposEmpaque(), empaque);
    const nuevo: CompraDetalleItem = {
      productoId: producto.id,
      producto,
      pesoKg: Math.max(1, tara + 0.5),
      empaque,
    };
    this.items.update((list) => [...list, nuevo]);
    this.mensaje.set(null);
    this.error.set(null);
  }

  ajustarPeso(productoId: number, delta: number): void {
    this.items.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        const minimo = this.pesoBrutoMinimo(item.empaque);
        const peso = Math.max(minimo, Math.round((item.pesoKg + delta) * 2) / 2);
        return { ...item, pesoKg: peso };
      })
    );
  }

  onPesoInput(productoId: number, value: string): void {
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(parsed)) return;
    this.items.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        const minimo = this.pesoBrutoMinimo(item.empaque);
        return { ...item, pesoKg: Math.max(minimo, parsed) };
      })
    );
  }

  setEmpaque(productoId: number, empaque: EmpaqueTipo): void {
    this.items.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        const minimo = this.pesoBrutoMinimo(empaque);
        return {
          ...item,
          empaque,
          pesoKg: Math.max(minimo, item.pesoKg),
        };
      })
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

  pesoEmpaqueItem(item: CompraDetalleItem): number {
    return pesoEmpaqueKg(this.tiposEmpaque(), item.empaque);
  }

  pesoNetoItem(item: CompraDetalleItem): number {
    return pesoNetoKg(item.pesoKg, this.pesoEmpaqueItem(item));
  }

  itemTotal(item: CompraDetalleItem): number {
    return this.pesoNetoItem(item) * productoPrecioKg(item.producto);
  }

  private pesoBrutoMinimo(empaque: string): number {
    const tara = pesoEmpaqueKg(this.tiposEmpaque(), empaque);
    return Math.round((tara + 0.5) * 2) / 2;
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
    const tipo = this.tiposEmpaque().find((t) => t.nombre === empaque);
    if (!tipo) {
      return empaque || '—';
    }
    return `${tipo.nombre} (${this.formatPeso(tipo.peso)} KG)`;
  }

  private empaquePorDefecto(): string {
    return this.tiposEmpaque()[0]?.nombre ?? '';
  }

  productoIcono(): string {
    return '📦';
  }

  registrarPreCompra(): void {
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
    const pesoSnapshot = this.pesoNetoTotal();

    this.comprasService
      .registrarPreCompra({
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
          this.proveedorSeleccionado.set(null);
        },
        error: (err) => {
          this.procesando.set(false);
          this.error.set(this.extractErrorMessage(err));
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
    return body?.message ?? 'No se pudo registrar la pre-compra.';
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
        pesoKg: this.pesoNetoItem(item),
        precioKg: productoPrecioKg(item.producto),
        total: this.itemTotal(item),
        empaque: this.empaqueLabel(item.empaque),
      })),
      total,
      pesoTotal,
    });
  }
}
