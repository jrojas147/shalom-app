import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CompraDetalleItem, EmpaqueTipo } from '../../core/models/compra.model';
import { CodigoCiiu } from '../../core/models/codigo-ciiu.model';
import {
  Producto,
  productoImagenUrl,
} from '../../core/models/producto.model';
import { tipoClienteLabel } from '../../core/models/cliente.model';
import { TipoEmpaque } from '../../core/models/tipo-empaque.model';
import {
  VentaClienteSeleccion,
  ventaClienteEtiqueta,
} from '../../core/models/venta.model';
import { CodigosCiiuService } from '../../core/services/codigos-ciiu.service';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductosService } from '../../core/services/productos.service';
import { TiposEmpaqueService } from '../../core/services/tipos-empaque.service';
import { VentasService } from '../../core/services/ventas.service';
import { pesoBrutoFromNetoKg, pesoEmpaqueKg } from '../../core/utils/empaque-peso.util';
import { VentaClienteModalComponent } from './venta-cliente-modal/venta-cliente-modal.component';
import { CajaSaldo } from '../../core/models/caja.model';
import { MedioCaja, medioCajaDetalle } from '../../core/models/medio-caja.model';
import { CajaService } from '../../core/services/caja.service';
import { MediosCajaService } from '../../core/services/medios-caja.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

interface MedioPagoOpcion {
  id: number;
  nombre: string;
  detalle: string;
}

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [FormsModule, VentaClienteModalComponent, RpModalComponent],
  templateUrl: './venta.component.html',
  styleUrls: ['../compras/compras.component.scss', './venta.component.scss'],
})
export class VentaComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly inventarioService = inject(InventarioService);
  private readonly codigosCiiuService = inject(CodigosCiiuService);
  private readonly tiposEmpaqueService = inject(TiposEmpaqueService);
  private readonly ventasService = inject(VentasService);
  private readonly cajaService = inject(CajaService);
  private readonly mediosCajaService = inject(MediosCajaService);

  readonly ventaClienteEtiqueta = ventaClienteEtiqueta;
  readonly tipoClienteLabel = tipoClienteLabel;
  readonly productoImagenUrl = productoImagenUrl;

  readonly productos = signal<Producto[]>([]);
  readonly existencias = signal<Map<number, number>>(new Map());
  readonly codigosCiiu = signal<CodigoCiiu[]>([]);
  readonly tiposEmpaque = signal<TipoEmpaque[]>([]);
  readonly items = signal<CompraDetalleItem[]>([]);
  readonly clienteSeleccionado = signal<VentaClienteSeleccion | null>(null);
  readonly busqueda = signal('');
  readonly codigoCiiuFiltro = signal<number | null>(null);
  readonly loading = signal(false);
  readonly showClienteModal = signal(false);
  readonly showPagoModal = signal(false);
  readonly procesando = signal(false);
  readonly loadingMediosPago = signal(false);
  readonly mensaje = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly factura = signal('—');
  readonly mediosPago = signal<MedioPagoOpcion[]>([]);
  readonly medioPagoId = signal<number | null>(null);

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

  readonly pesoBrutoTotal = computed(() =>
    this.items().reduce((sum, item) => sum + this.pesoBrutoItem(item), 0)
  );

  readonly pesoNetoTotal = computed(() =>
    this.items().reduce((sum, item) => sum + this.pesoNetoItem(item), 0)
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

  stockProducto(productoId: number): number {
    return this.existencias().get(productoId) ?? 0;
  }

  precioVentaKg(producto: Producto): number {
    const actual = this.productos().find((p) => p.id === producto.id) ?? producto;
    return Number(actual.precioVenta) || 0;
  }

  agregarProducto(producto: Producto): void {
    if (this.tiposEmpaque().length === 0) {
      this.error.set(
        'No hay tipos de empaque parametrizados. Configure al menos uno en Parametrización.'
      );
      return;
    }

    const catalogo = this.productos().find((p) => p.id === producto.id) ?? producto;
    const stock = this.stockProducto(catalogo.id);
    if (stock <= 0) {
      this.error.set(`Sin stock disponible para ${catalogo.nombreInterno}.`);
      return;
    }

    const existente = this.items().find((i) => i.productoId === catalogo.id);
    if (existente) {
      this.items.update((list) =>
        list.map((item) =>
          item.productoId === catalogo.id ? { ...item, producto: catalogo } : item
        )
      );
      if (this.pesoNetoItem({ ...existente, producto: catalogo }) >= stock) {
        this.error.set(
          `No puede vender más de ${this.formatPeso(stock)} KG de ${catalogo.nombreInterno}.`
        );
        return;
      }
      this.ajustarPeso(catalogo.id, 0.5);
      return;
    }

    const empaque = this.tiposEmpaque()[0]?.nombre ?? '';
    const netoInicial = 0.5;
    if (netoInicial > stock) {
      this.error.set(
        `Stock insuficiente para ${catalogo.nombreInterno}. Disponible: ${this.formatPeso(stock)} KG`
      );
      return;
    }

    const nuevo: CompraDetalleItem = {
      productoId: catalogo.id,
      producto: catalogo,
      // pesoKg en venta = peso del producto (neto), sin tara.
      pesoKg: netoInicial,
      empaque,
    };
    this.items.update((list) => [...list, nuevo]);
    this.mensaje.set(null);
    this.error.set(null);
  }

  ajustarPeso(productoId: number, delta: number): void {
    const stock = this.stockProducto(productoId);
    const actual = this.items().find((i) => i.productoId === productoId);
    if (!actual) return;

    const netoDeseado = Math.max(0.5, Math.round((actual.pesoKg + delta) * 2) / 2);
    if (netoDeseado > stock) {
      this.error.set(
        `Stock insuficiente para ${actual.producto.nombreInterno}. Disponible: ${this.formatPeso(stock)} KG`
      );
      return;
    }

    this.error.set(null);
    this.items.update((list) =>
      list.map((item) =>
        item.productoId === productoId ? { ...item, pesoKg: netoDeseado } : item
      )
    );
  }

  onPesoInput(productoId: number, value: string): void {
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(parsed)) return;

    const stock = this.stockProducto(productoId);
    const actual = this.items().find((i) => i.productoId === productoId);
    if (!actual) return;

    const neto = Math.max(0.5, parsed);
    if (neto > stock) {
      this.error.set(
        `Stock insuficiente para ${actual.producto.nombreInterno}. Disponible: ${this.formatPeso(stock)} KG`
      );
      this.items.update((list) => [...list]);
      return;
    }

    this.error.set(null);
    this.items.update((list) =>
      list.map((item) =>
        item.productoId === productoId ? { ...item, pesoKg: neto } : item
      )
    );
  }

  puedeAumentarPeso(productoId: number, pesoActual: number): boolean {
    const siguiente = Math.round((pesoActual + 0.5) * 2) / 2;
    return siguiente <= this.stockProducto(productoId);
  }

  setEmpaque(productoId: number, empaque: EmpaqueTipo): void {
    this.items.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        // Al cambiar empaque se conserva el peso del producto (neto);
        // el bruto se recalcula solo con la tara del nuevo empaque.
        this.error.set(null);
        return { ...item, empaque };
      })
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

  /** Peso del producto (sin empaque). */
  pesoNetoItem(item: CompraDetalleItem): number {
    return Math.max(0, Number(item.pesoKg) || 0);
  }

  /** Peso bruto = producto + tara del empaque. */
  pesoBrutoItem(item: CompraDetalleItem): number {
    return pesoBrutoFromNetoKg(
      this.pesoNetoItem(item),
      pesoEmpaqueKg(this.tiposEmpaque(), item.empaque)
    );
  }

  itemTotal(item: CompraDetalleItem): number {
    return this.pesoNetoItem(item) * this.precioVentaKg(item.producto);
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

    this.error.set(null);
    this.mensaje.set(null);
    this.showPagoModal.set(true);
    this.loadingMediosPago.set(true);

    this.cajaService.obtenerActual().subscribe({
      next: (caja) => {
        if (!caja) {
          this.loadingMediosPago.set(false);
          this.error.set('Debe abrir la caja antes de registrar una venta.');
          return;
        }
        const saldos = caja.saldos ?? [];
        if (saldos.length) {
          this.setMediosDesdeSaldos(saldos);
          this.loadingMediosPago.set(false);
          return;
        }
        this.cargarMediosActivos();
      },
      error: (err) => {
        this.loadingMediosPago.set(false);
        this.error.set(this.extractErrorMessage(err) || 'Debe abrir la caja antes de registrar una venta.');
      },
    });
  }

  cancelarPagoModal(): void {
    this.showPagoModal.set(false);
  }

  seleccionarMedioPago(id: number): void {
    this.medioPagoId.set(id);
  }

  confirmarPagoYRegistrar(): void {
    const medioId = this.medioPagoId();
    if (medioId == null) {
      this.error.set('Seleccione el medio de pago.');
      return;
    }
    this.ejecutarRegistroVenta(medioId);
  }

  private setMediosDesdeSaldos(saldos: CajaSaldo[]): void {
    const opciones = saldos.map((saldo) => ({
      id: saldo.medioCajaId,
      nombre: saldo.medioNombre,
      detalle: saldo.detalle?.trim() || '',
    }));
    this.mediosPago.set(opciones);
    this.seleccionarMedioPorDefecto(opciones, saldos.find((s) => s.medioTipo === 'EFECTIVO')?.medioCajaId);
  }

  private cargarMediosActivos(): void {
    this.mediosCajaService.getAll(true).subscribe({
      next: (medios) => {
        const opciones = (medios ?? []).map((medio) => this.toOpcion(medio));
        this.mediosPago.set(opciones);
        this.seleccionarMedioPorDefecto(
          opciones,
          medios?.find((medio) => medio.tipo === 'EFECTIVO')?.id
        );
        this.loadingMediosPago.set(false);
        if (!opciones.length) {
          this.error.set(
            'No hay medios de pago activos. Configure Nequi, Daviplata o cuentas en Parametrización.'
          );
        }
      },
      error: (err) => {
        this.loadingMediosPago.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  private toOpcion(medio: MedioCaja): MedioPagoOpcion {
    return {
      id: medio.id,
      nombre: medio.nombre,
      detalle: medioCajaDetalle(medio),
    };
  }

  private seleccionarMedioPorDefecto(opciones: MedioPagoOpcion[], efectivoId?: number): void {
    const actual = this.medioPagoId();
    if (actual && opciones.some((opcion) => opcion.id === actual)) {
      return;
    }
    this.medioPagoId.set(efectivoId ?? opciones[0]?.id ?? null);
  }

  private ejecutarRegistroVenta(medioCajaId: number): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;

    this.procesando.set(true);
    this.error.set(null);

    this.productosService.getActivos().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.items.update((list) =>
          list.map((item) => {
            const actual = productos.find((p) => p.id === item.productoId);
            return actual ? { ...item, producto: actual } : item;
          })
        );

        for (const item of this.items()) {
          if (this.precioVentaKg(item.producto) <= 0) {
            this.procesando.set(false);
            this.error.set(
              `El producto '${item.producto.nombreInterno}' no tiene precio de venta configurado.`
            );
            return;
          }
          const stock = this.stockProducto(item.productoId);
          if (this.pesoNetoItem(item) > stock) {
            this.procesando.set(false);
            this.error.set(
              `Stock insuficiente para ${item.producto.nombreInterno}. Disponible: ${this.formatPeso(stock)} KG`
            );
            return;
          }
        }

        this.ventasService
          .registrar({
            cliente,
            items: this.items(),
            total: this.subtotal(),
            pesoTotal: this.pesoNetoTotal(),
            medioCajaId,
          })
          .subscribe({
            next: (res) => {
              this.procesando.set(false);
              this.showPagoModal.set(false);
              this.factura.set(res.factura);
              this.mensaje.set(res.mensaje);
              this.items.set([]);
              this.clienteSeleccionado.set(null);
              this.medioPagoId.set(null);
              this.recargarExistencias();
            },
            error: (err) => {
              this.procesando.set(false);
              this.error.set(this.extractErrorMessage(err));
            },
          });
      },
      error: () => {
        this.procesando.set(false);
        this.error.set('No se pudieron actualizar los precios de los productos.');
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
