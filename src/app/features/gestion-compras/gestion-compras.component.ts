import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Compra,
  compraProveedorFromCompra,
} from '../../core/models/compra-registro.model';
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
import { Producto, productoPrecioKg } from '../../core/models/producto.model';
import { ComprasService } from '../../core/services/compras.service';
import { ProductosService } from '../../core/services/productos.service';
import { RpConfirmDialogService } from '../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';
import { CompraProveedorModalComponent } from '../compras/compra-proveedor-modal/compra-proveedor-modal.component';

@Component({
  selector: 'app-gestion-compras',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RpModalComponent,
    CompraProveedorModalComponent,
  ],
  templateUrl: './gestion-compras.component.html',
  styleUrl: './gestion-compras.component.scss',
})
export class GestionComprasComponent implements OnInit {
  private readonly comprasService = inject(ComprasService);
  private readonly productosService = inject(ProductosService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly compraProveedorEtiqueta = compraProveedorEtiqueta;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;
  readonly empaqueOpciones = EMPAQUE_OPCIONES;
  readonly productoPrecioKg = productoPrecioKg;

  readonly compras = signal<Compra[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly compraSeleccionada = signal<Compra | null>(null);
  readonly editMode = signal(false);
  readonly proveedorEdit = signal<CompraProveedorSeleccion | null>(null);
  readonly itemsEdit = signal<CompraDetalleItem[]>([]);
  readonly showProveedorModal = signal(false);

  readonly subtotalEdit = computed(() =>
    this.itemsEdit().reduce((sum, item) => sum + this.itemTotal(item), 0)
  );

  readonly pesoTotalEdit = computed(() =>
    this.itemsEdit().reduce((sum, item) => sum + item.pesoKg, 0)
  );

  ngOnInit(): void {
    this.loadCompras();
    this.productosService.getActivos().subscribe({
      next: (data) => this.productos.set(data),
      error: () => this.productos.set([]),
    });
  }

  loadCompras(): void {
    this.loading.set(true);
    this.error.set(null);
    this.comprasService.listar('PENDIENTE').subscribe({
      next: (data) => {
        this.compras.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  abrirDetalle(compra: Compra): void {
    this.error.set(null);
    this.mensaje.set(null);
    this.editMode.set(false);
    this.comprasService.obtener(compra.id).subscribe({
      next: (detalle) => {
        this.compraSeleccionada.set(detalle);
        this.syncEditState(detalle);
      },
      error: (err) => this.error.set(this.extractErrorMessage(err)),
    });
  }

  cerrarDetalle(): void {
    this.compraSeleccionada.set(null);
    this.editMode.set(false);
    this.showProveedorModal.set(false);
  }

  activarEdicion(): void {
    const compra = this.compraSeleccionada();
    if (!compra) return;
    this.syncEditState(compra);
    this.editMode.set(true);
  }

  cancelarEdicion(): void {
    const compra = this.compraSeleccionada();
    if (compra) {
      this.syncEditState(compra);
    }
    this.editMode.set(false);
  }

  abrirModalProveedor(): void {
    this.showProveedorModal.set(true);
  }

  cerrarModalProveedor(): void {
    this.showProveedorModal.set(false);
  }

  seleccionarProveedor(proveedor: CompraProveedorSeleccion): void {
    this.proveedorEdit.set(proveedor);
    this.showProveedorModal.set(false);
  }

  ajustarPeso(productoId: number, delta: number): void {
    this.itemsEdit.update((list) =>
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
    this.itemsEdit.update((list) =>
      list.map((item) =>
        item.productoId === productoId ? { ...item, pesoKg: parsed } : item
      )
    );
  }

  setEmpaque(productoId: number, empaque: EmpaqueTipo): void {
    this.itemsEdit.update((list) =>
      list.map((item) =>
        item.productoId === productoId ? { ...item, empaque } : item
      )
    );
  }

  guardarCambios(): void {
    const compra = this.compraSeleccionada();
    const proveedor = this.proveedorEdit();
    if (!compra || !proveedor) {
      this.error.set('Seleccione un proveedor válido.');
      return;
    }
    if (this.itemsEdit().length === 0) {
      this.error.set('La pre-compra debe tener al menos un producto.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const payload = this.buildPayload(proveedor);

    this.comprasService.actualizar(compra.id, payload).subscribe({
      next: (actualizada) => {
        this.saving.set(false);
        this.compraSeleccionada.set(actualizada);
        this.syncEditState(actualizada);
        this.editMode.set(false);
        this.mensaje.set('Pre-compra actualizada correctamente.');
        this.loadCompras();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  confirmarCompra(): void {
    const compra = this.compraSeleccionada();
    const proveedor = this.proveedorEdit();
    if (!compra || !proveedor) {
      this.error.set('Seleccione un proveedor válido.');
      return;
    }
    if (this.itemsEdit().length === 0) {
      this.error.set('La pre-compra debe tener al menos un producto.');
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Confirmar pre-compra',
        message: '¿Confirmar esta pre-compra? Se actualizará el inventario.',
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.ejecutarConfirmacionCompra(compra, proveedor);
      });
  }

  private ejecutarConfirmacionCompra(
    compra: Compra,
    proveedor: CompraProveedorSeleccion
  ): void {
    this.saving.set(true);
    this.error.set(null);
    const payload = this.buildPayload(proveedor);
    const request$ = this.editMode()
      ? this.comprasService.confirmar(compra.id, payload)
      : this.comprasService.confirmar(compra.id);

    request$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.mensaje.set(res.mensaje);
        this.cerrarDetalle();
        this.loadCompras();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
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

  itemTotal(item: CompraDetalleItem): number {
    return item.pesoKg * productoPrecioKg(item.producto);
  }

  empaqueLabel(empaque?: EmpaqueTipo | string | null): string {
    if (!empaque) return '—';
    return this.empaqueOpciones.find((o) => o.value === empaque)?.label ?? empaque;
  }

  private syncEditState(compra: Compra): void {
    this.proveedorEdit.set(compraProveedorFromCompra(compra));
    this.itemsEdit.set(this.mapDetalleToItems(compra));
  }

  private mapDetalleToItems(compra: Compra): CompraDetalleItem[] {
    const productosMap = new Map(this.productos().map((p) => [p.id, p]));

    return compra.detalle.map((linea) => {
      const producto =
        productosMap.get(linea.productoId) ??
        ({
          id: linea.productoId,
          comercioId: 0,
          nombreInterno: linea.productoNombre ?? `Producto ${linea.productoId}`,
          activo: true,
          precioCompra: linea.precioUnitario ?? null,
          precioVenta: null,
        } satisfies Producto);

      return {
        productoId: linea.productoId,
        producto,
        pesoKg: Number(linea.pesoKg),
        empaque: (linea.empaque as EmpaqueTipo) ?? 'Globo Grande',
      };
    });
  }

  private buildPayload(proveedor: CompraProveedorSeleccion) {
    return {
      proveedor,
      items: this.itemsEdit(),
      total: this.subtotalEdit(),
      pesoTotal: this.pesoTotalEdit(),
    };
  }

  private extractErrorMessage(err: {
    error?: { message?: string; errors?: Record<string, string> };
  }): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) return first;
    }
    return body?.message ?? 'Ocurrió un error al procesar la solicitud.';
  }
}
