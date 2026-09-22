import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CarteraCliente, CarteraVenta } from '../../core/models/cartera.model';
import { CajaSaldo } from '../../core/models/caja.model';
import { tipoClienteLabel, TipoCliente } from '../../core/models/cliente.model';
import { CarteraService } from '../../core/services/cartera.service';
import { CajaService } from '../../core/services/caja.service';
import { formatCurrencyCo, parseCurrencyCo, resolveCurrencyCoCursor } from '../../core/utils/currency.util';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-cartera',
  standalone: true,
  imports: [RpModalComponent],
  templateUrl: './cartera.component.html',
  styleUrl: './cartera.component.scss',
})
export class CarteraComponent implements OnInit {
  private readonly carteraService = inject(CarteraService);
  private readonly cajaService = inject(CajaService);

  readonly clientes = signal<CarteraCliente[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly clienteDetalle = signal<CarteraCliente | null>(null);
  readonly ventaPago = signal<CarteraVenta | null>(null);
  readonly mediosPago = signal<CajaSaldo[]>([]);
  readonly medioPagoId = signal<number | null>(null);
  readonly loadingMedios = signal(false);
  readonly savingPago = signal(false);
  readonly errorPago = signal<string | null>(null);
  readonly montoPago = signal(0);
  readonly montoPagoDisplay = signal(formatCurrencyCo(0));
  readonly mensaje = signal<string | null>(null);

  readonly clientesFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const lista = this.clientes();
    if (!q) {
      return lista;
    }
    return lista.filter((item) => {
      const fields = [
        item.nombre,
        item.documento,
        item.tipoDocumento,
        item.telefono,
        item.tipoCliente,
      ];
      return fields.some((value) => value?.toLowerCase().includes(q));
    });
  });

  readonly totalCartera = computed(() =>
    this.clientes().reduce((acc, item) => acc + (Number(item.saldoPendiente) || 0), 0)
  );

  readonly puedeConfirmarPago = computed(() => {
    const venta = this.ventaPago();
    const monto = this.montoPago();
    const saldo = Number(venta?.saldoPendiente) || 0;
    return this.medioPagoId() != null && monto > 0 && monto <= saldo + 0.001 && !this.savingPago();
  });

  ngOnInit(): void {
    this.loadCartera();
  }

  loadCartera(): void {
    this.loading.set(true);
    this.error.set(null);
    this.carteraService.listarPendientes().subscribe({
      next: (data) => {
        this.clientes.set(data ?? []);
        this.loading.set(false);
        const abierto = this.clienteDetalle();
        if (abierto) {
          this.clienteDetalle.set(
            (data ?? []).find((item) => item.clienteId === abierto.clienteId) ?? null
          );
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'No se pudo cargar la cartera.');
      },
    });
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  abrirDetalle(item: CarteraCliente): void {
    this.clienteDetalle.set(item);
    this.mensaje.set(null);
  }

  cerrarDetalle(): void {
    if (this.ventaPago()) {
      return;
    }
    this.clienteDetalle.set(null);
    this.mensaje.set(null);
  }

  abrirPago(venta: CarteraVenta): void {
    this.ventaPago.set(venta);
    this.errorPago.set(null);
    this.mensaje.set(null);
    this.setMontoPago(Number(venta.saldoPendiente) || 0);
    this.medioPagoId.set(null);
    this.mediosPago.set([]);
    this.loadingMedios.set(true);

    this.cajaService.obtenerActual().subscribe({
      next: (caja) => {
        this.loadingMedios.set(false);
        if (!caja) {
          this.errorPago.set('Debe abrir la caja antes de registrar el pago.');
          return;
        }
        const saldos = caja.saldos ?? [];
        this.mediosPago.set(saldos);
        const efectivo = saldos.find((saldo) => saldo.medioTipo === 'EFECTIVO');
        this.medioPagoId.set(efectivo?.medioCajaId ?? saldos[0]?.medioCajaId ?? null);
        if (!saldos.length) {
          this.errorPago.set('No hay medios de pago en la caja abierta.');
        }
      },
      error: (err) => {
        this.loadingMedios.set(false);
        this.errorPago.set(err.error?.message ?? 'Debe abrir la caja antes de registrar el pago.');
      },
    });
  }

  cancelarPago(): void {
    if (this.savingPago()) {
      return;
    }
    this.ventaPago.set(null);
    this.errorPago.set(null);
    this.medioPagoId.set(null);
  }

  seleccionarMedioPago(id: number): void {
    this.medioPagoId.set(id);
  }

  onMontoPagoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectionStart = input.selectionStart ?? input.value.length;
    const digitsBefore = input.value.slice(0, selectionStart).replace(/\D/g, '').length;
    const parsed = parseCurrencyCo(input.value) ?? 0;
    const formatted = formatCurrencyCo(parsed);
    this.setMontoPago(parsed);
    input.value = formatted;
    const cursor = resolveCurrencyCoCursor(formatted, digitsBefore);
    requestAnimationFrame(() => input.setSelectionRange(cursor, cursor));
  }

  confirmarPago(): void {
    const venta = this.ventaPago();
    const medioId = this.medioPagoId();
    const monto = this.montoPago();
    if (!venta || medioId == null || !this.puedeConfirmarPago()) {
      return;
    }

    this.savingPago.set(true);
    this.errorPago.set(null);
    this.carteraService.registrarPago(venta.ventaId, { medioCajaId: medioId, monto }).subscribe({
      next: (res) => {
        this.savingPago.set(false);
        this.ventaPago.set(null);
        this.mensaje.set(res.mensaje);
        this.loadCartera();
      },
      error: (err) => {
        this.savingPago.set(false);
        this.errorPago.set(err.error?.message ?? 'No se pudo registrar el pago.');
      },
    });
  }

  tipoLabel(tipo?: string | null): string {
    if (!tipo) {
      return '—';
    }
    return tipoClienteLabel(tipo as TipoCliente);
  }

  formatCurrency(value?: number | null): string {
    return formatCurrencyCo(value ?? 0) || '$ 0';
  }

  formatFecha(value?: string | null): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  formatFechaDia(value?: string | null): string {
    if (!value) {
      return '—';
    }
    const datePart = value.slice(0, 10);
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) {
      return '—';
    }
    return new Date(year, month - 1, day).toLocaleDateString('es-CO');
  }

  compromisoVencido(item: CarteraCliente): boolean {
    const fechas = [
      item.fechaProyectadaPago,
      ...(item.ventas ?? []).map((venta) => venta.fechaProyectadaPago),
    ];
    return fechas.some((fecha) => this.fechaCompromisoVencida(fecha));
  }

  ventaCompromisoVencida(venta: CarteraVenta): boolean {
    return this.fechaCompromisoVencida(venta.fechaProyectadaPago);
  }

  private fechaCompromisoVencida(fecha?: string | null): boolean {
    const dia = fecha?.slice(0, 10);
    return !!dia && dia <= this.hoyIso();
  }

  private hoyIso(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  documento(item: CarteraCliente): string {
    if (!item.documento) {
      return '—';
    }
    return item.tipoDocumento ? `${item.tipoDocumento} ${item.documento}` : item.documento;
  }

  ventasDe(item: CarteraCliente): CarteraVenta[] {
    return item.ventas ?? [];
  }

  abonosCliente(item: CarteraCliente): number {
    if (item.totalAbonos != null && Number.isFinite(Number(item.totalAbonos))) {
      return Number(item.totalAbonos);
    }
    const total = Number(item.totalVentas) || 0;
    const saldo = Number(item.saldoPendiente) || 0;
    return Math.max(0, total - saldo);
  }

  abonosDe(venta: CarteraVenta): number {
    if (venta.abonos != null && Number.isFinite(Number(venta.abonos))) {
      return Number(venta.abonos);
    }
    const total = Number(venta.total) || 0;
    const saldo = Number(venta.saldoPendiente) || 0;
    return Math.max(0, total - saldo);
  }

  private setMontoPago(value: number): void {
    this.montoPago.set(value);
    this.montoPagoDisplay.set(formatCurrencyCo(value));
  }
}
