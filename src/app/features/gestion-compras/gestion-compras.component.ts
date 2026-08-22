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
import { CompraDetalleItem, EmpaqueTipo } from '../../core/models/compra.model';
import { Producto, productoPrecioKg } from '../../core/models/producto.model';
import { TipoEmpaque } from '../../core/models/tipo-empaque.model';
import {
  permiteIngresoManual,
  permiteLecturaBascula,
  TipoLecturaPeso,
} from '../../core/models/configuracion-lectura-peso.model';
import { BasculaService } from '../../core/services/bascula.service';
import { ComprasService } from '../../core/services/compras.service';
import { ConfiguracionLecturaPesoService } from '../../core/services/configuracion-lectura-peso.service';
import { ProductosService } from '../../core/services/productos.service';
import { TiposEmpaqueService } from '../../core/services/tipos-empaque.service';
import { pesoEmpaqueKg, pesoNetoKg } from '../../core/utils/empaque-peso.util';
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
  private readonly tiposEmpaqueService = inject(TiposEmpaqueService);
  private readonly configuracionLecturaPesoService = inject(ConfiguracionLecturaPesoService);
  private readonly basculaService = inject(BasculaService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly compraProveedorEtiqueta = compraProveedorEtiqueta;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;
  readonly productoPrecioKg = productoPrecioKg;

  readonly compras = signal<Compra[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly tiposEmpaque = signal<TipoEmpaque[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly lecturaPeso = signal<TipoLecturaPeso | null>(null);
  readonly leyendoPesoId = signal<number | null>(null);

  readonly permiteManual = computed(() => permiteIngresoManual(this.lecturaPeso()));
  readonly permiteBascula = computed(() =>
    permiteLecturaBascula(this.lecturaPeso(), false)
  );

  readonly compraSeleccionada = signal<Compra | null>(null);
  readonly editMode = signal(false);
  readonly proveedorEdit = signal<CompraProveedorSeleccion | null>(null);
  readonly itemsEdit = signal<CompraDetalleItem[]>([]);
  readonly showProveedorModal = signal(false);

  readonly subtotalEdit = computed(() =>
    this.itemsEdit().reduce((sum, item) => sum + this.itemTotal(item), 0)
  );

  readonly pesoBrutoTotalEdit = computed(() =>
    this.itemsEdit().reduce((sum, item) => sum + item.pesoKg, 0)
  );

  readonly pesoNetoTotalEdit = computed(() =>
    this.itemsEdit().reduce((sum, item) => sum + this.pesoNetoItem(item), 0)
  );

  ngOnInit(): void {
    this.loadCompras();
    this.productosService.getActivos().subscribe({
      next: (data) => this.productos.set(data),
      error: () => this.productos.set([]),
    });
    this.tiposEmpaqueService.getAll().subscribe({
      next: (data) => this.tiposEmpaque.set(data),
      error: () => this.tiposEmpaque.set([]),
    });
    this.configuracionLecturaPesoService.get().subscribe({
      next: (data) => this.lecturaPeso.set(data.preCompra),
      error: () => this.lecturaPeso.set('MANUAL'),
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
    if (!this.permiteManual()) {
      return;
    }
    this.itemsEdit.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        const minimo = this.pesoBrutoMinimo(item.empaque);
        const peso = Math.max(minimo, Math.round((item.pesoKg + delta) * 2) / 2);
        return { ...item, pesoKg: peso };
      })
    );
  }

  onPesoInput(productoId: number, value: string): void {
    if (!this.permiteManual()) {
      return;
    }
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(parsed)) return;
    this.itemsEdit.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        const minimo = this.pesoBrutoMinimo(item.empaque);
        return { ...item, pesoKg: Math.max(minimo, parsed) };
      })
    );
  }

  detectarPeso(productoId: number): void {
    if (!this.permiteBascula() || this.leyendoPesoId() != null) {
      return;
    }

    this.leyendoPesoId.set(productoId);
    this.error.set(null);
    this.mensaje.set(null);

    this.basculaService.leerPeso().subscribe({
      next: (lectura) => {
        const kg = Number(lectura.pesoKg ?? lectura.gramos / 1000);
        this.leyendoPesoId.set(null);
        if (!Number.isFinite(kg) || kg <= 0) {
          this.error.set('La báscula devolvió un peso inválido.');
          return;
        }
        const actual = this.itemsEdit().find((i) => i.productoId === productoId);
        if (!actual) return;
        const tara = pesoEmpaqueKg(this.tiposEmpaque(), actual.empaque);
        if (kg + 0.0005 < tara) {
          this.error.set(
            `El peso detectado (${this.formatPeso(kg)} KG) es menor que la tara del empaque.`
          );
          return;
        }
        const bruto = Math.max(tara, Math.round(kg * 1000) / 1000);
        this.itemsEdit.update((list) =>
          list.map((item) =>
            item.productoId === productoId ? { ...item, pesoKg: bruto } : item
          )
        );
        this.mensaje.set(
          `Peso detectado: ${this.formatPeso(kg)} KG (${lectura.gramos} g)`
        );
      },
      error: (err) => {
        this.leyendoPesoId.set(null);
        this.error.set(this.extractErrorMessage(err, 'No se pudo leer la báscula.'));
      },
    });
  }

  setEmpaque(productoId: number, empaque: EmpaqueTipo): void {
    this.itemsEdit.update((list) =>
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

  anularCompra(): void {
    const compra = this.compraSeleccionada();
    if (!compra) return;

    this.confirmDialog
      .confirm({
        title: 'Anular pre-compra',
        message: `¿Anular la pre-compra ${compra.numeroFactura}? El estado pasará a cancelada.`,
        confirmLabel: 'Anular',
        cancelLabel: 'Volver',
        confirmVariant: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.ejecutarAnulacionCompra(compra);
      });
  }

  private ejecutarAnulacionCompra(compra: Compra): void {
    this.saving.set(true);
    this.error.set(null);

    this.comprasService.anular(compra.id).subscribe({
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

  pesoNetoItem(item: CompraDetalleItem): number {
    return pesoNetoKg(item.pesoKg, pesoEmpaqueKg(this.tiposEmpaque(), item.empaque));
  }

  itemTotal(item: CompraDetalleItem): number {
    return this.pesoNetoItem(item) * productoPrecioKg(item.producto);
  }

  private pesoBrutoMinimo(empaque: string): number {
    const tara = pesoEmpaqueKg(this.tiposEmpaque(), empaque);
    return Math.round((tara + 0.5) * 2) / 2;
  }

  empaqueLabel(empaque?: EmpaqueTipo | string | null): string {
    if (!empaque) return '—';
    const tipo = this.tiposEmpaque().find((t) => t.nombre === empaque);
    if (!tipo) {
      return empaque;
    }
    return `${tipo.nombre} (${this.formatPeso(tipo.peso)} KG)`;
  }

  esEmpaqueFueraDeCatalogo(empaque?: string | null): boolean {
    if (!empaque?.trim()) {
      return false;
    }
    return !this.tiposEmpaque().some((t) => t.nombre === empaque);
  }

  private empaquePorDefecto(): string {
    return this.tiposEmpaque()[0]?.nombre ?? '';
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
          estado: 'ACTIVO',
          fechaEstado: new Date(0).toISOString(),
          precioCompra: linea.precioUnitario ?? null,
          precioVenta: null,
        } satisfies Producto);

      const empaque = linea.empaque?.trim() || this.empaquePorDefecto();
      const pesoNeto = Number(linea.pesoKg) || 0;
      const pesoBruto = pesoNeto + pesoEmpaqueKg(this.tiposEmpaque(), empaque);

      return {
        productoId: linea.productoId,
        producto,
        pesoKg: pesoBruto,
        empaque,
      };
    });
  }

  private buildPayload(proveedor: CompraProveedorSeleccion) {
    return {
      proveedor,
      items: this.itemsEdit(),
      total: this.subtotalEdit(),
      pesoTotal: this.pesoNetoTotalEdit(),
    };
  }

  private extractErrorMessage(
    err: { error?: { message?: string; errors?: Record<string, string> } },
    fallback = 'Ocurrió un error al procesar la solicitud.'
  ): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) return first;
    }
    return body?.message ?? fallback;
  }
}
