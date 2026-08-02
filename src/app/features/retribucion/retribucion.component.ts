import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Compra } from '../../core/models/compra-registro.model';
import { EMPAQUE_OPCIONES } from '../../core/models/compra.model';
import { PROVEEDOR_TABS, ProveedorTabConfig, TipoProveedor } from '../../core/models/proveedor.model';
import {
  mapExternoPendiente,
  mapInternoPendiente,
  RetribucionExterno,
  RetribucionInterno,
  RetribucionProveedorPendiente,
} from '../../core/models/retribucion.model';
import { AuthService } from '../../core/services/auth.service';
import { CajaService } from '../../core/services/caja.service';
import { ComprasService } from '../../core/services/compras.service';
import { PagoComprobantePrintService } from '../../core/services/pago-comprobante-print.service';
import { RetribucionService } from '../../core/services/retribucion.service';
import { RpConfirmDialogService } from '../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-retribucion',
  standalone: true,
  imports: [DatePipe, RpModalComponent],
  templateUrl: './retribucion.component.html',
  styleUrl: './retribucion.component.scss',
})
export class RetribucionComponent implements OnInit {
  private readonly retribucionService = inject(RetribucionService);
  private readonly comprasService = inject(ComprasService);
  private readonly cajaService = inject(CajaService);
  private readonly confirmDialog = inject(RpConfirmDialogService);
  private readonly auth = inject(AuthService);
  private readonly pagoPrintService = inject(PagoComprobantePrintService);

  readonly tabs = PROVEEDOR_TABS;
  readonly tabActiva = signal<TipoProveedor>('INTERNO');
  readonly internos = signal<RetribucionInterno[]>([]);
  readonly externos = signal<RetribucionExterno[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly proveedorSeleccionado = signal<RetribucionProveedorPendiente | null>(null);
  readonly comprasPendientes = signal<Compra[]>([]);
  readonly loadingCompras = signal(false);
  readonly errorModal = signal<string | null>(null);

  readonly compraDetalleResumen = signal<Compra | null>(null);
  readonly compraDetalle = signal<Compra | null>(null);
  readonly loadingDetalle = signal(false);
  readonly savingPago = signal(false);
  readonly errorDetalle = signal<string | null>(null);

  readonly tabConfig = computed(
    () => this.tabs.find((tab) => tab.id === this.tabActiva()) ?? this.tabs[0]
  );

  readonly esTabInterna = computed(() => this.tabActiva() === 'INTERNO');
  readonly esTabExterna = computed(() => this.tabActiva() === 'EXTERNO');

  ngOnInit(): void {
    this.loadTab();
  }

  setTab(tab: ProveedorTabConfig): void {
    if (this.tabActiva() === tab.id) {
      return;
    }
    this.tabActiva.set(tab.id);
    this.cerrarValidacion();
    this.loadTab();
  }

  loadTab(): void {
    this.error.set(null);

    if (this.tabActiva() === 'INTERNO') {
      this.loadInternos();
      return;
    }

    if (this.tabActiva() === 'EXTERNO') {
      this.loadExternos();
      return;
    }

    this.internos.set([]);
    this.externos.set([]);
    this.loading.set(false);
  }

  abrirValidacionInterno(item: RetribucionInterno): void {
    this.abrirValidacion(mapInternoPendiente(item));
  }

  abrirValidacionExterno(item: RetribucionExterno): void {
    this.abrirValidacion(mapExternoPendiente(item));
  }

  abrirValidacion(item: RetribucionProveedorPendiente): void {
    this.cerrarDetalle();
    this.proveedorSeleccionado.set(item);
    this.comprasPendientes.set([]);
    this.errorModal.set(null);
    this.loadingCompras.set(true);

    this.cargarComprasPendientes(item).subscribe({
      next: (data) => {
        this.comprasPendientes.set(data);
        this.loadingCompras.set(false);
      },
      error: (err) => {
        this.loadingCompras.set(false);
        this.errorModal.set(this.extractErrorMessage(err, 'No se pudieron cargar las compras.'));
      },
    });
  }

  cerrarValidacion(): void {
    this.cerrarDetalle();
    this.proveedorSeleccionado.set(null);
    this.comprasPendientes.set([]);
    this.errorModal.set(null);
    this.loadingCompras.set(false);
  }

  abrirDetalle(compra: Compra): void {
    this.compraDetalleResumen.set(compra);
    this.errorDetalle.set(null);

    const lineas = compra.detalle ?? [];
    if (lineas.length > 0) {
      this.compraDetalle.set({ ...compra, detalle: lineas });
      this.loadingDetalle.set(false);
      return;
    }

    this.compraDetalle.set(null);
    this.loadingDetalle.set(true);

    this.comprasService.obtener(compra.id).subscribe({
      next: (detalle) => {
        this.compraDetalle.set({
          ...detalle,
          detalle: detalle.detalle ?? [],
        });
        this.loadingDetalle.set(false);
      },
      error: (err) => {
        this.loadingDetalle.set(false);
        this.errorDetalle.set(this.extractErrorMessage(err, 'No se pudo cargar el detalle.'));
      },
    });
  }

  cerrarDetalle(): void {
    this.compraDetalleResumen.set(null);
    this.compraDetalle.set(null);
    this.errorDetalle.set(null);
    this.loadingDetalle.set(false);
    this.savingPago.set(false);
  }

  aceptarPago(): void {
    const compra = this.compraDetalle();
    if (!compra || this.savingPago()) {
      return;
    }

    this.errorDetalle.set(null);
    this.savingPago.set(true);

    this.cajaService.obtenerActual().subscribe({
      next: (caja) => {
        this.savingPago.set(false);

        if (!caja) {
          this.errorDetalle.set(
            'Debe abrir la caja antes de registrar el pago de la retribución.'
          );
          return;
        }

        const saldoCaja = Number(caja.saldoActual ?? 0);
        const totalPago = Number(compra.total) || 0;
        if (saldoCaja < totalPago) {
          this.errorDetalle.set(
            `Saldo de caja insuficiente. Disponible: ${this.formatCurrency(saldoCaja)}. Requerido: ${this.formatCurrency(totalPago)}.`
          );
          return;
        }

        this.confirmDialog
          .confirm({
            title: 'Registrar pago',
            message: `¿Registrar el pago de la compra ${compra.numeroFactura} por ${this.formatCurrency(totalPago)}? Saldo de caja disponible: ${this.formatCurrency(saldoCaja)}.`,
            confirmLabel: 'Aceptar',
            cancelLabel: 'Cancelar',
          })
          .subscribe((confirmed) => {
            if (!confirmed) {
              return;
            }
            this.ejecutarRegistroPago(compra);
          });
      },
      error: (err) => {
        this.savingPago.set(false);
        this.errorDetalle.set(
          this.extractErrorMessage(err, 'No se pudo validar el saldo de caja.')
        );
      },
    });
  }

  private ejecutarRegistroPago(compra: Compra): void {
    this.savingPago.set(true);
    this.errorDetalle.set(null);

    const detalle = this.compraDetalle() ?? compra;
    const proveedor = this.proveedorSeleccionado();

    this.comprasService.registrarPago(compra.id).subscribe({
      next: () => {
        this.imprimirComprobantePago(detalle, proveedor);
        this.savingPago.set(false);
        this.cerrarDetalle();
        this.refrescarTrasPago();
      },
      error: (err) => {
        this.savingPago.set(false);
        this.errorDetalle.set(this.extractErrorMessage(err, 'No se pudo registrar el pago.'));
      },
    });
  }

  private imprimirComprobantePago(
    compra: Compra,
    proveedor: RetribucionProveedorPendiente | null
  ): void {
    const user = this.auth.currentUser();
    const nombreUsuario = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();
    const documento =
      proveedor?.documento != null
        ? `${proveedor.tipoDocumento ?? ''} ${proveedor.documento}`.trim()
        : null;

    const fallbackNombre =
      proveedor?.tipo === 'EXTERNO' ? 'Proveedor externo' : 'Proveedor interno';

    this.pagoPrintService.imprimir({
      factura: compra.numeroFactura,
      fecha: new Date(),
      comercioNombre: user?.comercioNombre ?? 'Comercio',
      usuarioNombre: nombreUsuario || user?.username || 'Usuario',
      usuarioUsername: user?.username ?? '',
      beneficiarioNombre: proveedor?.nombre ?? compra.proveedorNombre ?? fallbackNombre,
      beneficiarioDocumento: documento,
      sucursalNombre: compra.sucursalNombre,
      items: (compra.detalle ?? []).map((linea) => ({
        nombre: linea.productoNombre ?? `Producto ${linea.productoId}`,
        pesoKg: Number(linea.pesoKg) || 0,
        precioKg: Number(linea.precioUnitario) || 0,
        total: Number(linea.subtotal) || 0,
        empaque: this.empaqueLabel(linea.empaque),
      })),
      total: Number(compra.total) || 0,
      pesoTotal: Number(compra.pesoTotal) || 0,
    });
  }

  private refrescarTrasPago(): void {
    const proveedor = this.proveedorSeleccionado();
    if (!proveedor) {
      this.loadTab();
      return;
    }

    this.loadingCompras.set(true);
    this.cargarComprasPendientes(proveedor).subscribe({
      next: (data) => {
        this.comprasPendientes.set(data);
        this.loadingCompras.set(false);
        this.loadTab();
        if (data.length === 0) {
          this.cerrarValidacion();
        }
      },
      error: (err) => {
        this.loadingCompras.set(false);
        this.errorModal.set(this.extractErrorMessage(err, 'No se pudieron cargar las compras.'));
        this.loadTab();
      },
    });
  }

  private cargarComprasPendientes(proveedor: RetribucionProveedorPendiente) {
    if (proveedor.tipo === 'EXTERNO') {
      return this.retribucionService.listarComprasPendientesExterno(proveedor.proveedorId);
    }
    return this.retribucionService.listarComprasPendientesInterno(proveedor.proveedorId);
  }

  empaqueLabel(empaque?: string | null): string {
    if (!empaque) return '—';
    return EMPAQUE_OPCIONES.find((o) => o.value === empaque)?.label ?? empaque;
  }

  private loadInternos(): void {
    this.loading.set(true);

    this.retribucionService.listarInternosPendientesPago().subscribe({
      next: (data) => {
        this.internos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.internos.set([]);
        this.error.set(this.extractErrorMessage(err, 'No se pudieron cargar los recicladores.'));
      },
    });
  }

  private loadExternos(): void {
    this.loading.set(true);

    this.retribucionService.listarExternosPendientesPago().subscribe({
      next: (data) => {
        this.externos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.externos.set([]);
        this.error.set(
          this.extractErrorMessage(err, 'No se pudieron cargar los proveedores externos.')
        );
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

  private extractErrorMessage(
    err: { error?: { message?: string; errors?: Record<string, string> } },
    fallback: string
  ): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) return first;
    }
    return body?.message ?? fallback;
  }
}
