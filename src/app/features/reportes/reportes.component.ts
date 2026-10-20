import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { metodoPagoLabel, tipoClienteLabel } from '../../core/models/cliente.model';
import { compraProveedorTipoLabel } from '../../core/models/compra-proveedor.model';
import { TipoProveedor } from '../../core/models/proveedor.model';
import { CAJA_CONCEPTO_LABEL } from '../../core/models/caja.model';
import {
  ESTADOS_COMPRA_REPORTE,
  ReporteCaja,
  ReporteCajaConcepto,
  ReporteCajaMovimientoTipo,
  ReporteCliente,
  ReporteCompra,
  ReporteCompraEstado,
  ReporteGasto,
  ReporteMovimientoCaja,
  ReporteProveedor,
  ReporteRangoFechas,
  ReporteVenta,
  reporteCajaEstadoLabel,
  reporteCompraEstadoLabel,
} from '../../core/models/reporte.model';
import { ReportesService } from '../../core/services/reportes.service';
import { formatCurrencyCo } from '../../core/utils/currency.util';

type GrupoReporte = 'compras' | 'ventas' | 'caja';
type SubreporteId = 'compras' | 'proveedores' | 'ventas' | 'clientes' | 'cajas' | 'movimientos' | 'gastos';

interface SubreporteInfo {
  id: SubreporteId;
  titulo: string;
  descripcion: string;
}

interface GrupoInfo {
  id: GrupoReporte;
  titulo: string;
  descripcion: string;
  subreportes: SubreporteInfo[];
}

const TIPOS_PROVEEDOR: { value: TipoProveedor; label: string }[] = [
  { value: 'INTERNO', label: 'Internos' },
  { value: 'EXTERNO', label: 'Externos' },
  { value: 'EMPRESA', label: 'Empresas' },
];

const GRUPOS: GrupoInfo[] = [
  {
    id: 'compras',
    titulo: 'Compras',
    descripcion: 'Compras y proveedores',
    subreportes: [
      {
        id: 'compras',
        titulo: 'Compras',
        descripcion: 'Registro de compras realizadas',
      },
      {
        id: 'proveedores',
        titulo: 'Proveedores',
        descripcion: 'Proveedores registrados',
      },
    ],
  },
  {
    id: 'ventas',
    titulo: 'Ventas',
    descripcion: 'Ventas y clientes',
    subreportes: [
      {
        id: 'ventas',
        titulo: 'Ventas',
        descripcion: 'Registro de ventas realizadas',
      },
      {
        id: 'clientes',
        titulo: 'Clientes',
        descripcion: 'Registro de clientes',
      },
    ],
  },
  {
    id: 'caja',
    titulo: 'Caja',
    descripcion: 'Cierres, movimientos y gastos',
    subreportes: [
      {
        id: 'cajas',
        titulo: 'Cierres',
        descripcion: 'Cierres de caja por fechas',
      },
      {
        id: 'movimientos',
        titulo: 'Movimientos caja',
        descripcion: 'Detalle de movimientos de caja',
      },
      {
        id: 'gastos',
        titulo: 'Gastos',
        descripcion: 'Gastos registrados por fechas',
      },
    ],
  },
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

  readonly grupos = GRUPOS;
  readonly estadosCompra = ESTADOS_COMPRA_REPORTE;
  readonly tiposProveedor = TIPOS_PROVEEDOR;
  readonly reporteCompraEstadoLabel = reporteCompraEstadoLabel;
  readonly reporteCajaEstadoLabel = reporteCajaEstadoLabel;
  readonly compraProveedorTipoLabel = compraProveedorTipoLabel;
  readonly tipoClienteLabel = tipoClienteLabel;
  readonly metodoPagoLabel = metodoPagoLabel;

  readonly grupo = signal<GrupoReporte>('compras');
  readonly subreporte = signal<SubreporteId>('compras');

  readonly grupoActual = computed(
    () => this.grupos.find((item) => item.id === this.grupo()) ?? this.grupos[0]
  );
  readonly subreportesActuales = computed(() => this.grupoActual().subreportes);
  readonly subreporteActual = computed(
    () =>
      this.subreportesActuales().find((item) => item.id === this.subreporte()) ??
      this.subreportesActuales()[0]
  );

  readonly desde = signal(primerDiaMesIso());
  readonly hasta = signal(hoyIso());
  readonly estadoCompra = signal<ReporteCompraEstado | null>('CONFIRMADA');
  readonly tipoProveedor = signal<TipoProveedor | null>(null);
  readonly incluirInactivos = signal(false);

  readonly compras = signal<ReporteCompra[] | null>(null);
  readonly ventas = signal<ReporteVenta[] | null>(null);
  readonly clientes = signal<ReporteCliente[] | null>(null);
  readonly proveedores = signal<ReporteProveedor[] | null>(null);
  readonly cajas = signal<ReporteCaja[] | null>(null);
  readonly movimientos = signal<ReporteMovimientoCaja[] | null>(null);
  readonly gastos = signal<ReporteGasto[] | null>(null);

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

  readonly totalesCajas = computed(() => {
    const cajas = this.cajas() ?? [];
    return cajas.reduce(
      (acc, caja) => ({
        ingresos: acc.ingresos + Number(caja.totalIngresos || 0),
        egresos: acc.egresos + Number(caja.totalEgresos || 0),
        ventas: acc.ventas + Number(caja.totalVentas || 0),
        pagos: acc.pagos + Number(caja.totalPagosProveedor || 0),
      }),
      { ingresos: 0, egresos: 0, ventas: 0, pagos: 0 }
    );
  });

  readonly totalesMovimientos = computed(() => {
    const movimientos = this.movimientos() ?? [];
    return movimientos.reduce(
      (acc, mov) => {
        const monto = Number(mov.monto || 0);
        if (mov.tipo === 'INGRESO') {
          acc.ingresos += monto;
        } else {
          acc.egresos += monto;
        }
        return acc;
      },
      { ingresos: 0, egresos: 0 }
    );
  });

  readonly totalGastos = computed(() =>
    (this.gastos() ?? []).reduce((acc, gasto) => acc + Number(gasto.monto || 0), 0)
  );

  ngOnInit(): void {
    this.cargar();
  }

  setGrupo(grupo: GrupoReporte): void {
    if (this.grupo() === grupo) {
      return;
    }
    const info = this.grupos.find((item) => item.id === grupo);
    if (!info) {
      return;
    }
    this.grupo.set(grupo);
    this.error.set(null);
    this.setSubreporte(info.subreportes[0].id, true);
  }

  setSubreporte(subreporte: SubreporteId, forzar = false): void {
    if (!forzar && this.subreporte() === subreporte) {
      return;
    }
    this.subreporte.set(subreporte);
    this.error.set(null);
    if (forzar || this.datosPaso(subreporte) === null) {
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
    const paso = this.subreporte();
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
      case 'cajas':
        this.suscribir(this.reportesService.getCajas(rango!), (data) => this.cajas.set(data));
        break;
      case 'movimientos':
        this.suscribir(this.reportesService.getMovimientosCaja(rango!), (data) =>
          this.movimientos.set(data)
        );
        break;
      case 'gastos':
        this.suscribir(this.reportesService.getGastos(rango!), (data) => this.gastos.set(data));
        break;
    }
  }

  descargarExcel(): void {
    if (this.exporting()) {
      return;
    }
    const paso = this.subreporte();
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
      case 'cajas':
        descarga$ = this.reportesService.exportarCajas(rango!);
        nombre = `reporte-cierres-caja_${rango!.desde}_${rango!.hasta}.xlsx`;
        break;
      case 'movimientos':
        descarga$ = this.reportesService.exportarMovimientosCaja(rango!);
        nombre = `reporte-movimientos-caja_${rango!.desde}_${rango!.hasta}.xlsx`;
        break;
      case 'gastos':
        descarga$ = this.reportesService.exportarGastos(rango!);
        nombre = `reporte-gastos_${rango!.desde}_${rango!.hasta}.xlsx`;
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

  usaFechas(paso: SubreporteId = this.subreporte()): boolean {
    return (
      paso === 'compras' ||
      paso === 'ventas' ||
      paso === 'cajas' ||
      paso === 'movimientos' ||
      paso === 'gastos'
    );
  }

  cantidadRegistros(): number {
    return this.datosPaso(this.subreporte())?.length ?? 0;
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

  tipoMovimientoLabel(tipo: ReporteCajaMovimientoTipo): string {
    return tipo === 'INGRESO' ? 'Ingreso' : 'Egreso';
  }

  conceptoMovimientoLabel(concepto: ReporteCajaConcepto, tipoAbonoNombre?: string | null): string {
    const label = CAJA_CONCEPTO_LABEL[concepto] ?? concepto;
    return tipoAbonoNombre?.trim() ? `${label} · ${tipoAbonoNombre}` : label;
  }

  referenciaMovimientoLabel(tipo: string | null | undefined, id: number | null | undefined): string {
    if (!tipo && (id == null || id === undefined)) {
      return '—';
    }
    const prefijos: Record<string, string> = {
      COMPRA: 'Compra',
      VENTA: 'Venta',
      GASTO: 'Gasto',
      ANTICIPO: 'Anticipo',
    };
    const prefijo = (tipo && prefijos[tipo]) || 'Ref';
    return id == null ? prefijo : `${prefijo} #${id}`;
  }

  private recargarPorFechas(): void {
    this.compras.set(null);
    this.ventas.set(null);
    this.cajas.set(null);
    this.movimientos.set(null);
    this.gastos.set(null);
    this.cargar();
  }

  private datosPaso(paso: SubreporteId): unknown[] | null {
    switch (paso) {
      case 'compras':
        return this.compras();
      case 'ventas':
        return this.ventas();
      case 'clientes':
        return this.clientes();
      case 'proveedores':
        return this.proveedores();
      case 'cajas':
        return this.cajas();
      case 'movimientos':
        return this.movimientos();
      case 'gastos':
        return this.gastos();
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
