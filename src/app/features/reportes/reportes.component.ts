import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { metodoPagoLabel, tipoClienteLabel } from '../../core/models/cliente.model';
import { compraProveedorTipoLabel } from '../../core/models/compra-proveedor.model';
import { TipoProveedor } from '../../core/models/proveedor.model';
import {
  ESTADOS_COMPRA_REPORTE,
  ReporteCliente,
  ReporteCompra,
  ReporteCompraEstado,
  ReporteProveedor,
  ReporteRangoFechas,
  ReporteVenta,
  reporteCompraEstadoLabel,
} from '../../core/models/reporte.model';
import { ReportesService } from '../../core/services/reportes.service';
import { formatCurrencyCo } from '../../core/utils/currency.util';

type PasoReporte = 'compras' | 'ventas' | 'clientes' | 'proveedores';

interface PasoInfo {
  id: PasoReporte;
  numero: number;
  titulo: string;
  descripcion: string;
}

const TIPOS_PROVEEDOR: { value: TipoProveedor; label: string }[] = [
  { value: 'INTERNO', label: 'Internos' },
  { value: 'EXTERNO', label: 'Externos' },
  { value: 'EMPRESA', label: 'Empresas' },
];

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);

  readonly pasos: PasoInfo[] = [
    { id: 'compras', numero: 1, titulo: 'Compras', descripcion: 'Registro de compras realizadas' },
    { id: 'ventas', numero: 2, titulo: 'Ventas', descripcion: 'Registro de ventas realizadas' },
    { id: 'clientes', numero: 3, titulo: 'Clientes', descripcion: 'Registro de clientes' },
    { id: 'proveedores', numero: 4, titulo: 'Proveedores', descripcion: 'Proveedores registrados' },
  ];
  readonly estadosCompra = ESTADOS_COMPRA_REPORTE;
  readonly tiposProveedor = TIPOS_PROVEEDOR;
  readonly reporteCompraEstadoLabel = reporteCompraEstadoLabel;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;
  readonly tipoClienteLabel = tipoClienteLabel;
  readonly metodoPagoLabel = metodoPagoLabel;

  readonly paso = signal<PasoReporte>('compras');
  readonly pasoActual = computed(() => this.pasos.find((p) => p.id === this.paso())!);

  readonly desde = signal(primerDiaMesIso());
  readonly hasta = signal(hoyIso());
  readonly estadoCompra = signal<ReporteCompraEstado | null>('CONFIRMADA');
  readonly tipoProveedor = signal<TipoProveedor | null>(null);
  readonly incluirInactivos = signal(false);

  readonly compras = signal<ReporteCompra[] | null>(null);
  readonly ventas = signal<ReporteVenta[] | null>(null);
  readonly clientes = signal<ReporteCliente[] | null>(null);
  readonly proveedores = signal<ReporteProveedor[] | null>(null);

  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalesCompras = computed(() => sumar(this.compras() ?? []));
  readonly totalesVentas = computed(() => {
    const ventas = this.ventas() ?? [];
    return {
      ...sumar(ventas),
      saldo: ventas.reduce((acc, v) => acc + Number(v.saldoPendiente || 0), 0),
    };
  });

  ngOnInit(): void {
    this.cargar();
  }

  setPaso(paso: PasoReporte): void {
    if (this.paso() === paso) {
      return;
    }
    this.paso.set(paso);
    this.error.set(null);
    if (this.datosPaso(paso) === null) {
      this.cargar();
    }
  }

  onDesdeChange(value: string): void {
    this.desde.set(value);
    this.recargarPorFechas();
  }

  onHastaChange(value: string): void {
    this.hasta.set(value);
    this.recargarPorFechas();
  }

  onEstadoCompraChange(value: string): void {
    this.estadoCompra.set((value || null) as ReporteCompraEstado | null);
    this.cargar();
  }

  onTipoProveedorChange(value: string): void {
    this.tipoProveedor.set((value || null) as TipoProveedor | null);
    this.cargar();
  }

  onIncluirInactivosChange(value: boolean): void {
    this.incluirInactivos.set(value);
    this.clientes.set(null);
    this.proveedores.set(null);
    this.cargar();
  }

  cargar(): void {
    const paso = this.paso();
    const rango = this.usaFechas(paso) ? this.rangoValido() : null;
    if (!rango && this.usaFechas(paso)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const soloActivos = !this.incluirInactivos();

    switch (paso) {
      case 'compras':
        this.suscribir(this.reportesService.getCompras(rango!, this.estadoCompra()), (data) =>
          this.compras.set(data)
        );
        break;
      case 'ventas':
        this.suscribir(this.reportesService.getVentas(rango!), (data) => this.ventas.set(data));
        break;
      case 'clientes':
        this.suscribir(this.reportesService.getClientes(soloActivos), (data) =>
          this.clientes.set(data)
        );
        break;
      case 'proveedores':
        this.suscribir(
          this.reportesService.getProveedores(this.tipoProveedor(), soloActivos),
          (data) => this.proveedores.set(data)
        );
        break;
    }
  }

  descargarExcel(): void {
    if (this.exporting()) {
      return;
    }
    const paso = this.paso();
    const rango = this.usaFechas(paso) ? this.rangoValido() : null;
    if (!rango && this.usaFechas(paso)) {
      return;
    }

    const soloActivos = !this.incluirInactivos();
    let descarga$: Observable<Blob>;
    let nombre: string;
    switch (paso) {
      case 'compras':
        descarga$ = this.reportesService.exportarCompras(rango!, this.estadoCompra());
        nombre = `reporte-compras_${rango!.desde}_${rango!.hasta}.xlsx`;
        break;
      case 'ventas':
        descarga$ = this.reportesService.exportarVentas(rango!);
        nombre = `reporte-ventas_${rango!.desde}_${rango!.hasta}.xlsx`;
        break;
      case 'clientes':
        descarga$ = this.reportesService.exportarClientes(soloActivos);
        nombre = 'reporte-clientes.xlsx';
        break;
      case 'proveedores':
        descarga$ = this.reportesService.exportarProveedores(this.tipoProveedor(), soloActivos);
        nombre = 'reporte-proveedores.xlsx';
        break;
    }

    this.exporting.set(true);
    this.error.set(null);
    descarga$.subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombre;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.exporting.set(false);
        void this.mostrarError(err);
      },
    });
  }

  usaFechas(paso: PasoReporte = this.paso()): boolean {
    return paso === 'compras' || paso === 'ventas';
  }

  cantidadRegistros(): number {
    return this.datosPaso(this.paso())?.length ?? 0;
  }

  formatCurrency(value: number | null | undefined): string {
    return formatCurrencyCo(Number(value) || 0) || '$ 0';
  }

  formatPeso(value: number | null | undefined): string {
    const peso = Number(value) || 0;
    return peso.toLocaleString('es-CO', {
      minimumFractionDigits: peso % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 3,
    });
  }

  texto(value: string | null | undefined): string {
    return value?.trim() || '—';
  }

  private recargarPorFechas(): void {
    this.compras.set(null);
    this.ventas.set(null);
    this.cargar();
  }

  private datosPaso(paso: PasoReporte): unknown[] | null {
    switch (paso) {
      case 'compras':
        return this.compras();
      case 'ventas':
        return this.ventas();
      case 'clientes':
        return this.clientes();
      case 'proveedores':
        return this.proveedores();
    }
  }

  private rangoValido(): ReporteRangoFechas | null {
    const desde = this.desde();
    const hasta = this.hasta();
    if (!desde || !hasta) {
      this.error.set('Seleccione la fecha inicial y la fecha final.');
      return null;
    }
    if (desde > hasta) {
      this.error.set('La fecha inicial no puede ser mayor a la fecha final.');
      return null;
    }
    return { desde, hasta };
  }

  private suscribir<T>(fuente: Observable<T>, onData: (data: T) => void): void {
    fuente.subscribe({
      next: (data) => {
        onData(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        void this.mostrarError(err);
      },
    });
  }

  private async mostrarError(err: { error?: unknown }): Promise<void> {
    let body = err?.error;
    if (body instanceof Blob) {
      try {
        body = JSON.parse(await body.text());
      } catch {
        body = null;
      }
    }
    const data = body as { message?: string; errors?: Record<string, string> } | null;
    const first = data?.errors ? Object.values(data.errors)[0] : null;
    this.error.set(first || data?.message || 'Ocurrió un error al generar el reporte.');
  }
}

function sumar(items: { total: number; pesoTotal: number }[]): { total: number; peso: number } {
  return items.reduce(
    (acc, item) => ({
      total: acc.total + Number(item.total || 0),
      peso: acc.peso + Number(item.pesoTotal || 0),
    }),
    { total: 0, peso: 0 }
  );
}

function hoyIso(): string {
  return toIsoLocal(new Date());
}

function primerDiaMesIso(): string {
  const hoy = new Date();
  return toIsoLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

function toIsoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
