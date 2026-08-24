import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CierreMesCategoria,
  CierreMesPreview,
  CierreMesProducto,
  CierreMesResumen,
} from '../../../core/models/cierre-mes.model';
import { CierreMesService } from '../../../core/services/cierre-mes.service';
import { formatCurrencyCo } from '../../../core/utils/currency.util';
import { RpConfirmDialogService } from '../../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';
import { RpModalComponent } from '../../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-inventario-cierre-mes',
  standalone: true,
  imports: [DatePipe, RouterLink, RpModalComponent],
  templateUrl: './inventario-cierre-mes.component.html',
  styleUrl: './inventario-cierre-mes.component.scss',
})
export class InventarioCierreMesComponent {
  private readonly cierreMesService = inject(CierreMesService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly refreshToken = input(0);

  readonly preview = signal<CierreMesPreview | null>(null);
  readonly historial = signal<CierreMesResumen[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly observacion = signal('');
  readonly validados = signal<Set<number>>(new Set());
  readonly cierreHistorial = signal<CierreMesPreview | null>(null);

  readonly productos = computed(() => {
    const preview = this.preview();
    if (!preview) {
      return [];
    }
    return preview.categorias.flatMap((categoria) => categoria.items);
  });

  readonly categoriasFiltradas = computed(() => {
    const preview = this.preview();
    if (!preview) {
      return [];
    }
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return preview.categorias;
    }
    return preview.categorias
      .map((categoria) => ({
        ...categoria,
        items: categoria.items.filter((item) => this.matchesProducto(item, q)),
      }))
      .filter((categoria) => categoria.items.length > 0);
  });

  readonly totalProductos = computed(() => this.productos().length);

  readonly totalValidados = computed(() => {
    if (this.preview()?.yaCerrado) {
      return this.totalProductos();
    }
    return this.validados().size;
  });

  readonly todosValidados = computed(() => {
    const total = this.totalProductos();
    return this.totalValidados() === total;
  });

  readonly cajaAbierta = computed(() => this.preview()?.cajaAbierta === true);

  readonly puedeEjecutar = computed(
    () => !this.preview()?.yaCerrado && this.todosValidados() && !this.cajaAbierta() && !this.saving()
  );

  constructor() {
    effect(
      () => {
        this.refreshToken();
        untracked(() => this.load());
      },
      { allowSignalWrites: true }
    );
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      preview: this.cierreMesService.previsualizar(),
      historial: this.cierreMesService.historial(),
    }).subscribe({
      next: ({ preview, historial }) => {
        this.preview.set(preview);
        this.historial.set(historial ?? []);
        this.syncValidados(preview);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err, 'No se pudo cargar el cierre de mes.'));
      },
    });
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  onObservacionChange(value: string): void {
    this.observacion.set(value);
  }

  productoValidado(productoId: number): boolean {
    return this.preview()?.yaCerrado === true || this.validados().has(productoId);
  }

  toggleProducto(productoId: number, checked: boolean): void {
    if (this.preview()?.yaCerrado) {
      return;
    }
    const next = new Set(this.validados());
    if (checked) {
      next.add(productoId);
    } else {
      next.delete(productoId);
    }
    this.validados.set(next);
  }

  categoriaCompleta(categoria: CierreMesCategoria): boolean {
    return categoria.items.every((item) => this.productoValidado(item.productoId));
  }

  categoriaParcial(categoria: CierreMesCategoria): boolean {
    const marcados = categoria.items.filter((item) => this.productoValidado(item.productoId)).length;
    return marcados > 0 && marcados < categoria.items.length;
  }

  toggleCategoria(categoria: CierreMesCategoria, checked: boolean): void {
    if (this.preview()?.yaCerrado) {
      return;
    }
    const next = new Set(this.validados());
    for (const item of categoria.items) {
      if (checked) {
        next.add(item.productoId);
      } else {
        next.delete(item.productoId);
      }
    }
    this.validados.set(next);
  }

  toggleTodos(checked: boolean): void {
    if (this.preview()?.yaCerrado) {
      return;
    }
    if (!checked) {
      this.validados.set(new Set());
      return;
    }
    this.validados.set(new Set(this.productos().map((item) => item.productoId)));
  }

  ejecutar(): void {
    const preview = this.preview();
    if (!preview || preview.yaCerrado || this.saving()) {
      return;
    }
    if (preview.cajaAbierta) {
      this.error.set('Debe cerrar la caja antes de ejecutar el cierre de mes.');
      return;
    }
    if (!this.todosValidados()) {
      this.error.set('Marque todos los productos para validar el cierre de mes.');
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Ejecutar cierre de mes',
        message: `Se registrará el cierre de ${preview.periodoLabel} con ${this.totalProductos()} productos. Esta acción no se puede deshacer.`,
        confirmLabel: 'Ejecutar cierre',
      })
      .subscribe((accepted) => {
        if (!accepted) {
          return;
        }
        this.guardar();
      });
  }

  verCierre(item: CierreMesResumen): void {
    this.cierreMesService.getById(item.id).subscribe({
      next: (detalle) => {
        this.cierreHistorial.set(detalle);
      },
      error: (err) => {
        this.error.set(this.extractErrorMessage(err, 'No se pudo cargar el cierre seleccionado.'));
      },
    });
  }

  cerrarHistorialDetalle(): void {
    this.cierreHistorial.set(null);
  }

  formatPeso(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(Number(value))) {
      return '0';
    }
    const n = Number(value);
    return n.toLocaleString('es-CO', {
      minimumFractionDigits: n % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 3,
    });
  }

  formatUnidades(value: number | null | undefined): string {
    const unidades = Number(value);
    return Number.isFinite(unidades) && unidades > 0 ? String(Math.trunc(unidades)) : '—';
  }

  formatMoneda(value: number | null | undefined): string {
    return formatCurrencyCo(Number(value) || 0) || '$ 0';
  }

  private guardar(): void {
    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);

    this.cierreMesService
      .ejecutar({
        productoIds: this.productos().map((item) => item.productoId),
        observacion: this.observacion().trim() || null,
      })
      .subscribe({
        next: (preview) => {
          this.preview.set(preview);
          this.syncValidados(preview);
          this.observacion.set('');
          this.saving.set(false);
          this.mensaje.set(`Cierre de ${preview.periodoLabel} registrado.`);
          this.cierreMesService.historial().subscribe({
            next: (historial) => this.historial.set(historial ?? []),
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(this.extractErrorMessage(err, 'No se pudo ejecutar el cierre de mes.'));
        },
      });
  }

  private syncValidados(preview: CierreMesPreview): void {
    if (preview.yaCerrado) {
      this.validados.set(
        new Set(preview.categorias.flatMap((categoria) => categoria.items.map((item) => item.productoId)))
      );
      return;
    }
    this.validados.set(new Set());
  }

  private matchesProducto(item: CierreMesProducto, q: string): boolean {
    return (
      item.idVisible.toLowerCase().includes(q) ||
      item.idInterno.toLowerCase().includes(q) ||
      item.nombreProducto.toLowerCase().includes(q) ||
      item.codigoSui.toLowerCase().includes(q) ||
      item.nombreSui.toLowerCase().includes(q)
    );
  }

  private extractErrorMessage(
    err: { error?: { message?: string; errors?: Record<string, string> } },
    fallback: string
  ): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) {
        return first;
      }
    }
    return body?.message ?? fallback;
  }
}
