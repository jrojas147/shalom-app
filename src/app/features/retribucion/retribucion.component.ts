import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PROVEEDOR_TABS, ProveedorTabConfig, TipoProveedor } from '../../core/models/proveedor.model';
import { RetribucionInterno } from '../../core/models/retribucion.model';
import { RetribucionService } from '../../core/services/retribucion.service';

@Component({
  selector: 'app-retribucion',
  standalone: true,
  imports: [],
  templateUrl: './retribucion.component.html',
  styleUrl: './retribucion.component.scss',
})
export class RetribucionComponent implements OnInit {
  private readonly retribucionService = inject(RetribucionService);

  readonly tabs = PROVEEDOR_TABS;
  readonly tabActiva = signal<TipoProveedor>('INTERNO');
  readonly internos = signal<RetribucionInterno[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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

  private extractErrorMessage(err: {
    error?: { message?: string; errors?: Record<string, string> };
  }): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) return first;
    }
    return body?.message ?? 'No se pudieron cargar los recicladores.';
  }
}
