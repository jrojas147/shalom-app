import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CarteraCliente, CarteraVenta } from '../../core/models/cartera.model';
import { tipoClienteLabel, TipoCliente } from '../../core/models/cliente.model';
import { CarteraService } from '../../core/services/cartera.service';
import { formatCurrencyCo } from '../../core/utils/currency.util';
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

  readonly clientes = signal<CarteraCliente[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly clienteDetalle = signal<CarteraCliente | null>(null);

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
  }

  cerrarDetalle(): void {
    this.clienteDetalle.set(null);
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

  documento(item: CarteraCliente): string {
    if (!item.documento) {
      return '—';
    }
    return item.tipoDocumento ? `${item.tipoDocumento} ${item.documento}` : item.documento;
  }

  ventasDe(item: CarteraCliente): CarteraVenta[] {
    return item.ventas ?? [];
  }
}
