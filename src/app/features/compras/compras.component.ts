import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../core/models/cliente.model';
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
import { ClientesService } from '../../core/services/clientes.service';
import { ComprasService } from '../../core/services/compras.service';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.scss',
})
export class ComprasComponent implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly clientesService = inject(ClientesService);
  private readonly comprasService = inject(ComprasService);

  readonly empaqueOpciones = EMPAQUE_OPCIONES;
  readonly productoPrecioKg = productoPrecioKg;
  readonly productoImagenUrl = productoImagenUrl;

  readonly productos = signal<Producto[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly items = signal<CompraDetalleItem[]>([]);
  readonly clienteSeleccionado = signal<Cliente | null>(null);
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly showClienteModal = signal(false);
  readonly procesando = signal(false);
  readonly mensaje = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly factura = signal('0042');

  readonly productosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.productos().filter((p) => {
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

    this.clientesService.getActivos().subscribe({
      next: (data) => {
        this.clientes.set(data);
        if (data.length > 0) {
          this.clienteSeleccionado.set(data[0]);
        }
      },
    });
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
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

  abrirModalCliente(): void {
    this.showClienteModal.set(true);
  }

  cerrarModalCliente(): void {
    this.showClienteModal.set(false);
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.showClienteModal.set(false);
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

  procesar(metodo: 'TICKET' | 'CREDITO' | 'PAGO'): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente) {
      this.error.set('Seleccione un cliente para continuar.');
      this.abrirModalCliente();
      return;
    }
    if (this.items().length === 0) {
      this.error.set('Agregue al menos un producto a la compra.');
      return;
    }

    this.procesando.set(true);
    this.error.set(null);

    this.comprasService
      .procesar({
        cliente,
        items: this.items(),
        total: this.subtotal(),
        pesoTotal: this.pesoTotal(),
        metodo,
      })
      .subscribe({
        next: (res) => {
          this.procesando.set(false);
          this.factura.set(res.factura);
          this.mensaje.set(res.mensaje);
          this.items.set([]);
        },
        error: () => {
          this.procesando.set(false);
          this.error.set('No se pudo procesar la compra.');
        },
      });
  }
}
