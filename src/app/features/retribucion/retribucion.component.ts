import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Compra } from '../../core/models/compra-registro.model';
import { EMPAQUE_OPCIONES } from '../../core/models/compra.model';
import { PROVEEDOR_TABS, ProveedorTabConfig, TipoProveedor } from '../../core/models/proveedor.model';
import { RetribucionInterno } from '../../core/models/retribucion.model';
import { AuthService } from '../../core/services/auth.service';
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
  private readonly confirmDialog = inject(RpConfirmDialogService);
  private readonly auth = inject(AuthService);
  private readonly pagoPrintService = inject(PagoComprobantePrintService);

  readonly tabs = PROVEEDOR_TABS;
  readonly tabActiva = signal<TipoProveedor>('INTERNO');
  readonly internos = signal<RetribucionInterno[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly recicladorSeleccionado = signal<RetribucionInterno | null>(null);
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

    this.internos.set([]);
    this.loading.set(false);
  }

  abrirValidacion(item: RetribucionInterno): void {
    this.cerrarDetalle();
    this.recicladorSeleccionado.set(item);
    this.comprasPendientes.set([]);
    this.errorModal.set(null);
    this.loadingCompras.set(true);

    this.retribucionService.listarComprasPendientesInterno(item.recicladorId).subscribe({
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
    this.recicladorSeleccionado.set(null);
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

    this.confirmDialog
      .confirm({
        title: 'Registrar pago',
        message: `¿Registrar el pago de la compra ${compra.numeroFactura}? El estado de pago pasará a pagado.`,
        confirmLabel: 'Aceptar',
        cancelLabel: 'Cancelar',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.ejecutarRegistroPago(compra);
      });
  }

  private ejecutarRegistroPago(compra: Compra): void {
    this.savingPago.set(true);
    this.errorDetalle.set(null);

    const detalle = this.compraDetalle() ?? compra;
    const reciclador = this.recicladorSeleccionado();

    this.comprasService.registrarPago(compra.id).subscribe({
      next: () => {
        this.imprimirComprobantePago(detalle, reciclador);
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
    reciclador: RetribucionInterno | null
  ): void {
    const user = this.auth.currentUser();
    const nombreUsuario = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();
    const documento =
      reciclador?.documento != null
        ? `${reciclador.tipoDocumento ?? ''} ${reciclador.documento}`.trim()
        : null;

    this.pagoPrintService.imprimir({
      factura: compra.numeroFactura,
      fecha: new Date(),
      comercioNombre: user?.comercioNombre ?? 'Comercio',
      usuarioNombre: nombreUsuario || user?.username || 'Usuario',
      usuarioUsername: user?.username ?? '',
      beneficiarioNombre:
        reciclador?.nombre ?? compra.proveedorNombre ?? 'Proveedor interno',
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
    const reciclador = this.recicladorSeleccionado();
    if (!reciclador) {
      this.loadInternos();
      return;
    }

    this.loadingCompras.set(true);
    this.retribucionService.listarComprasPendientesInterno(reciclador.recicladorId).subscribe({
      next: (data) => {
        this.comprasPendientes.set(data);
        this.loadingCompras.set(false);
        this.loadInternos();
        if (data.length === 0) {
          this.cerrarValidacion();
        }
      },
      error: (err) => {
        this.loadingCompras.set(false);
        this.errorModal.set(this.extractErrorMessage(err, 'No se pudieron cargar las compras.'));
        this.loadInternos();
      },
    });
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
