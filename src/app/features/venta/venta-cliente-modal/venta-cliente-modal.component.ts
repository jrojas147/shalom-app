import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { Cliente, tipoClienteLabel } from '../../../core/models/cliente.model';
import { VentaClienteSeleccion } from '../../../core/models/venta.model';
import { ClientesService } from '../../../core/services/clientes.service';
import { RpModalComponent } from '../../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-venta-cliente-modal',
  standalone: true,
  imports: [RpModalComponent],
  templateUrl: './venta-cliente-modal.component.html',
  styleUrl: './venta-cliente-modal.component.scss',
})
export class VentaClienteModalComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);

  readonly seleccionActual = input<VentaClienteSeleccion | null>(null);
  readonly closed = output<void>();
  readonly seleccionado = output<VentaClienteSeleccion>();

  readonly tipoClienteLabel = tipoClienteLabel;

  readonly clientes = signal<Cliente[]>([]);
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly clientesFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.clientes().filter((c) => {
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.documento.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
      );
    });
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.clientesService.getAll(true).subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los clientes.');
      },
    });
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
  }

  seleccionar(cliente: Cliente): void {
    this.seleccionado.emit({
      clienteId: cliente.id,
      nombre: cliente.nombre,
      documento: cliente.documento,
      tipoCliente: cliente.tipoCliente,
    });
  }

  esSeleccionado(clienteId: number): boolean {
    return this.seleccionActual()?.clienteId === clienteId;
  }

  cerrar(): void {
    this.closed.emit();
  }
}
