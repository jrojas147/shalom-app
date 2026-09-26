import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import {
  Compra,
  CompraDetalleLinea,
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
import { SiigoCatalogoItem } from '../../core/models/configuracion-siigo.model';
import { ComprasService } from '../../core/services/compras.service';
import { ConfiguracionSiigoService } from '../../core/services/configuracion-siigo.service';
import { ConfiguracionLecturaPesoService } from '../../core/services/configuracion-lectura-peso.service';
import { TiposEmpaqueService } from '../../core/services/tipos-empaque.service';
import {
  EMPAQUE_SIN_NOMBRE,
  esSinEmpaque,
  pesoBrutoFromNetoKg,
  pesoEmpaqueKg,
} from '../../core/utils/empaque-peso.util';
import {
  precioSufijo,
  productoEsUnidad,
  totalLineaMedida,
  unidadesItem,
} from '../../core/utils/tipo-medida.util';
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
  private readonly configuracionSiigoService = inject(ConfiguracionSiigoService);
  private readonly tiposEmpaqueService = inject(TiposEmpaqueService);
  private readonly configuracionLecturaPesoService = inject(ConfiguracionLecturaPesoService);
  private readonly basculaService = inject(BasculaService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly compraProveedorEtiqueta = compraProveedorEtiqueta;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;
  readonly productoPrecioKg = productoPrecioKg;
  readonly productoEsUnidad = productoEsUnidad;
  readonly precioSufijo = precioSufijo;
  readonly unidadesItem = unidadesItem;
  readonly empaqueSinNombre = EMPAQUE_SIN_NOMBRE;
  readonly esSinEmpaque = esSinEmpaque;

  readonly compras = signal<Compra[]>([]);
  readonly tiposEmpaque = signal<TipoEmpaque[]>([]);
  readonly loading = signal(false);
  readonly loadingEdicion = signal(false);
  readonly saving = signal(false);
  private readonly parametrizacionEdicionCargada = signal(false);
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
  readonly centrosCosto = signal<SiigoCatalogoItem[]>([]);
  readonly loadingCentrosCosto = signal(false);
  readonly costCenterId = signal<number | null>(null);
  readonly receiptPrefix = signal('');
  readonly receiptNumber = signal('');

  readonly subtotalEdit = computed(() =>
    this.itemsEdit().reduce((sum, item) => sum + this.itemTotal(item), 0)
  );

  readonly pesoBrutoTotalEdit = computed(() =>
    this.itemsEdit().reduce((sum, item) => sum + this.pesoBrutoItem(item), 0)
  );

  readonly pesoNetoTotalEdit = computed(() =>
    this.itemsEdit().reduce((sum, item) => sum + this.pesoNetoItem(item), 0)
  );

  ngOnInit(): void {
    this.loadCompras();
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
    this.costCenterId.set(null);
    this.receiptPrefix.set('');
    this.receiptNumber.set('');
    this.centrosCosto.set([]);
    this.loadingCentrosCosto.set(true);
    forkJoin({
      detalle: this.comprasService.obtener(compra.id),
      centros: this.configuracionSiigoService.centrosCosto().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ detalle, centros }) => {
        this.compraSeleccionada.set(detalle);
        this.syncEditState(detalle);
        this.sugerirComprobanteProveedor(detalle.numeroFactura);
        this.centrosCosto.set(centros ?? []);
        this.loadingCentrosCosto.set(false);
        if (centros?.length === 1) {
          this.costCenterId.set(centros[0].id);
        }
      },
      error: (err) => {
        this.loadingCentrosCosto.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  cerrarDetalle(): void {
    this.compraSeleccionada.set(null);
    this.editMode.set(false);
    this.showProveedorModal.set(false);
    this.costCenterId.set(null);
    this.receiptPrefix.set('');
    this.receiptNumber.set('');
    this.centrosCosto.set([]);
  }

  activarEdicion(): void {
    const compra = this.compraSeleccionada();
    if (!compra || this.loadingEdicion()) {
      return;
    }

    if (this.parametrizacionEdicionCargada()) {
      this.entrarEdicion(compra);
      return;
    }

    this.loadingEdicion.set(true);
    this.error.set(null);
    forkJoin({
      tipos: this.tiposEmpaqueService.getAll(),
      lectura: this.configuracionLecturaPesoService.get(),
    }).subscribe({
      next: ({ tipos, lectura }) => {
        this.tiposEmpaque.set(tipos);
        this.lecturaPeso.set(lectura.preCompra);
        this.parametrizacionEdicionCargada.set(true);
        this.loadingEdicion.set(false);
        this.entrarEdicion(compra);
      },
      error: (err) => {
        this.loadingEdicion.set(false);
        this.error.set(
          this.extractErrorMessage(err, 'No se pudo cargar la parametrización para editar.')
        );
      },
    });
  }

  cancelarEdicion(): void {
    const compra = this.compraSeleccionada();
    if (compra) {
      this.syncEditState(compra);
    }
    this.editMode.set(false);
  }

  private entrarEdicion(compra: Compra): void {
    this.syncEditState(compra);
    this.editMode.set(true);
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

  ajustarUnidades(productoId: number, delta: number): void {
    this.itemsEdit.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId || !productoEsUnidad(item.producto)) {
          return item;
        }
        return { ...item, unidades: Math.max(1, unidadesItem(item.unidades) + delta) };
      })
    );
  }

  onUnidadesInput(productoId: number, value: string): void {
    const parsed = parseInt(value.replace(/\D/g, ''), 10);
    if (Number.isNaN(parsed)) return;
    this.itemsEdit.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId || !productoEsUnidad(item.producto)) {
          return item;
        }
        return { ...item, unidades: Math.max(1, parsed) };
      })
    );
  }

  ajustarPeso(productoId: number, delta: number): void {
    if (!this.permiteManual()) {
      return;
    }
    this.itemsEdit.update((list) =>
      list.map((item) => {
        if (item.productoId !== productoId) return item;
        const peso = Math.max(0.5, Math.round((item.pesoKg + delta) * 2) / 2);
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
        return { ...item, pesoKg: Math.max(0.001, parsed) };
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
        const neto = Math.max(0.001, Math.round(kg * 1000) / 1000);
        this.itemsEdit.update((list) =>
          list.map((item) =>
            item.productoId === productoId ? { ...item, pesoKg: neto } : item
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
        const sin = esSinEmpaque(empaque);
        return {
          ...item,
          empaque,
          cantidadEmpaques: sin ? 0 : Math.max(1, item.cantidadEmpaques || 1),
        };
      })
    );
  }

  setCantidadEmpaques(productoId: number, value: string | number): void {
    const parsed = parseInt(String(value).replace(/\D/g, ''), 10);
    if (Number.isNaN(parsed)) return;
    this.itemsEdit.update((list) =>
      list.map((item) =>
        item.productoId === productoId ? { ...item, cantidadEmpaques: Math.max(0, parsed) } : item
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
    if (this.centrosCosto().length > 0 && this.costCenterId() == null) {
      this.error.set('Seleccione el centro de costo para el documento soporte.');
      return;
    }
    if (!this.receiptPrefix().trim()) {
      this.error.set('Ingrese el prefijo del comprobante del proveedor.');
      return;
    }
    if (!this.receiptNumber().trim()) {
      this.error.set('Ingrese el consecutivo del comprobante del proveedor.');
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
    const request$ = this.comprasService.confirmar(compra.id, payload);

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

  /** Peso del producto (sin tara). */
  pesoNetoItem(item: CompraDetalleItem): number {
    return Math.max(0, Number(item.pesoKg) || 0);
  }

  /** Peso bruto = producto + tara. Cero tara si es Sin empaque. */
  pesoBrutoItem(item: CompraDetalleItem): number {
    return pesoBrutoFromNetoKg(
      this.pesoNetoItem(item),
      pesoEmpaqueKg(this.tiposEmpaque(), item.empaque)
    );
  }

  itemTotal(item: CompraDetalleItem): number {
    return totalLineaMedida(item.producto, this.pesoNetoItem(item), item.unidades, 'compra');
  }

  empaqueLabel(empaque?: EmpaqueTipo | string | null): string {
    if (esSinEmpaque(empaque)) {
      return 'Sin empaque';
    }
    if (!empaque) return '—';
    const tipo = this.tiposEmpaque().find((t) => t.nombre === empaque);
    if (!tipo) {
      return empaque;
    }
    return `${tipo.nombre} (${this.formatPeso(tipo.peso)} KG)`;
  }

  esEmpaqueFueraDeCatalogo(empaque?: string | null): boolean {
    if (esSinEmpaque(empaque)) {
      return false;
    }
    if (!empaque?.trim()) {
      return false;
    }
    return !this.tiposEmpaque().some((t) => t.nombre === empaque);
  }

  private empaquePorDefecto(): string {
    return EMPAQUE_SIN_NOMBRE;
  }

  private syncEditState(compra: Compra): void {
    this.proveedorEdit.set(compraProveedorFromCompra(compra));
    this.itemsEdit.set(this.mapDetalleToItems(compra));
  }

  private productoDesdeLinea(linea: CompraDetalleLinea): Producto {
    const porUnidad = !!linea.unidades && linea.unidades > 0;
    return {
      id: linea.productoId,
      comercioId: 0,
      nombreInterno: linea.productoNombre ?? `Producto ${linea.productoId}`,
      activo: true,
      estado: 'ACTIVO',
      fechaEstado: new Date(0).toISOString(),
      precioCompra: porUnidad
        ? (Number(linea.subtotal) || 0) / linea.unidades!
        : linea.precioUnitario ?? null,
      precioVenta: null,
      tipoMedida: porUnidad ? 'UNIDAD' : 'PESO',
    };
  }

  private mapDetalleToItems(compra: Compra): CompraDetalleItem[] {
    return compra.detalle.map((linea) => {
      const producto = this.productoDesdeLinea(linea);
      const raw = linea.empaque?.trim() ?? '';
      const empaque = esSinEmpaque(raw) ? EMPAQUE_SIN_NOMBRE : raw;

      return {
        productoId: linea.productoId,
        producto,
        pesoKg: Number(linea.pesoKg) || 0,
        empaque,
        unidades: productoEsUnidad(producto) ? unidadesItem(linea.unidades) : undefined,
        cantidadEmpaques: esSinEmpaque(empaque)
          ? 0
          : linea.cantidadEmpaques != null
            ? Number(linea.cantidadEmpaques)
            : 1,
      };
    });
  }

  private buildPayload(proveedor: CompraProveedorSeleccion) {
    return {
      proveedor,
      items: this.itemsEdit(),
      total: this.subtotalEdit(),
      pesoTotal: this.pesoNetoTotalEdit(),
      costCenterId: this.costCenterId(),
      supplierReceiptPrefix: this.receiptPrefix().trim(),
      supplierReceiptNumber: this.receiptNumber().trim(),
    };
  }

  onReceiptPrefix(value: string): void {
    this.receiptPrefix.set((value ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 6));
  }

  onReceiptNumber(value: string): void {
    this.receiptNumber.set((value ?? '').replace(/\D+/g, '').slice(0, 11));
  }

  private sugerirComprobanteProveedor(numeroFactura: string | null | undefined): void {
    this.receiptPrefix.set('DEM');
    this.onReceiptNumber(numeroFactura ?? '');
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
