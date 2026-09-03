import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CodigoCiiu,
  CodigoCiiuRequest,
  CodigoCiiuSiigoItem,
  CodigoCiiuSiigoSyncResult,
} from '../../../core/models/codigo-ciiu.model';
import { CodigosCiiuService } from '../../../core/services/codigos-ciiu.service';
import { ConfiguracionSiigoService } from '../../../core/services/configuracion-siigo.service';
import { RpConfirmDialogService } from '../../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';
import { RpModalComponent } from '../../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-codigos-ciiu-config',
  standalone: true,
  imports: [ReactiveFormsModule, RpModalComponent],
  templateUrl: './codigos-ciiu-config.component.html',
  styleUrl: './codigos-ciiu-config.component.scss',
})
export class CodigosCiiuConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly codigosCiiuService = inject(CodigosCiiuService);
  private readonly configuracionSiigoService = inject(ConfiguracionSiigoService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly codigosCiiu = signal<CodigoCiiu[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly siigoActivo = signal(false);
  readonly showSiigoModal = signal(false);
  readonly loadingSiigoCatalogo = signal(false);
  readonly syncingSiigo = signal(false);
  readonly siigoCatalogo = signal<CodigoCiiuSiigoItem[]>([]);
  readonly siigoSeleccion = signal<Set<number>>(new Set());
  readonly siigoBusqueda = signal('');
  readonly siigoCatalogoError = signal<string | null>(null);
  readonly siigoSyncResult = signal<CodigoCiiuSiigoSyncResult | null>(null);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
  });

  readonly siigoCatalogoFiltrado = computed(() => {
    const q = this.siigoBusqueda().trim().toLowerCase();
    if (!q) {
      return this.siigoCatalogo();
    }
    return this.siigoCatalogo().filter((item) => {
      const fields = [item.codigo, item.nombre, String(item.id)];
      return fields.some((value) => value?.toLowerCase().includes(q));
    });
  });

  readonly siigoSeleccionCount = computed(() => this.siigoSeleccion().size);

  readonly siigoTodosVisiblesSeleccionados = computed(() => {
    const visibles = this.siigoCatalogoFiltrado();
    if (!visibles.length) {
      return false;
    }
    const sel = this.siigoSeleccion();
    return visibles.every((item) => sel.has(item.id));
  });

  readonly siigoAlgunoVisibleSeleccionado = computed(() => {
    const visibles = this.siigoCatalogoFiltrado();
    const sel = this.siigoSeleccion();
    const n = visibles.filter((item) => sel.has(item.id)).length;
    return n > 0 && n < visibles.length;
  });

  ngOnInit(): void {
    this.loadCodigosCiiu();
    this.loadSiigoActivo();
  }

  loadCodigosCiiu(): void {
    this.loading.set(true);
    this.error.set(null);

    this.codigosCiiuService.getAll().subscribe({
      next: (data) => {
        this.codigosCiiu.set((data ?? []).filter((item) => item.estado === 'ACTIVO'));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los códigos CIIU.');
        this.loading.set(false);
      },
    });
  }

  startEdit(item: CodigoCiiu): void {
    this.editingId.set(item.id);
    this.form.reset({ codigo: item.codigo, nombre: item.nombre });
    this.error.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ codigo: '', nombre: '' });
    this.error.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: CodigoCiiuRequest = {
      codigo: raw.codigo.trim(),
      nombre: raw.nombre.trim(),
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.codigosCiiuService.update(id, request)
      : this.codigosCiiuService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.loadCodigosCiiu();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el código CIIU.');
      },
    });
  }

  deleteCodigo(item: CodigoCiiu): void {
    this.confirmDialog
      .confirm({
        title: 'Eliminar grupo de materiales',
        message: item.siigoAccountGroupId
          ? `¿Eliminar el grupo "${item.codigo}"? Dejará de listarse aquí y se eliminará también en Siigo. El historial en productos se conserva.`
          : `¿Eliminar el grupo "${item.codigo}"? Dejará de listarse y se mantendrá el historial en productos.`,
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        confirmVariant: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.codigosCiiuService.delete(item.id).subscribe({
          next: () => {
            if (this.editingId() === item.id) {
              this.cancelEdit();
            }
            this.loadCodigosCiiu();
          },
          error: (err) =>
            this.error.set(err.error?.message ?? 'No se pudo eliminar el código CIIU.'),
        });
      });
  }

  openSiigoModal(): void {
    if (this.loadingSiigoCatalogo() || this.syncingSiigo() || !this.siigoActivo()) {
      return;
    }
    this.showSiigoModal.set(true);
    this.siigoCatalogo.set([]);
    this.siigoSeleccion.set(new Set());
    this.siigoBusqueda.set('');
    this.siigoCatalogoError.set(null);
    this.siigoSyncResult.set(null);
    this.loadingSiigoCatalogo.set(true);
    this.codigosCiiuService.listarSiigo().subscribe({
      next: (data) => {
        this.siigoCatalogo.set(data ?? []);
        this.loadingSiigoCatalogo.set(false);
      },
      error: (err) => {
        this.loadingSiigoCatalogo.set(false);
        this.siigoCatalogoError.set(
          err.error?.message ?? 'No se pudieron consultar las categorías de Siigo.'
        );
      },
    });
  }

  closeSiigoModal(): void {
    if (this.syncingSiigo()) {
      return;
    }
    this.showSiigoModal.set(false);
    this.siigoCatalogo.set([]);
    this.siigoSeleccion.set(new Set());
    this.siigoBusqueda.set('');
    this.siigoCatalogoError.set(null);
  }

  onSiigoBusquedaChange(value: string): void {
    this.siigoBusqueda.set(value);
  }

  siigoSeleccionado(id: number): boolean {
    return this.siigoSeleccion().has(id);
  }

  toggleSiigoItem(id: number, checked: boolean): void {
    const next = new Set(this.siigoSeleccion());
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.siigoSeleccion.set(next);
  }

  toggleSiigoVisibles(checked: boolean): void {
    const next = new Set(this.siigoSeleccion());
    for (const item of this.siigoCatalogoFiltrado()) {
      if (checked) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
    }
    this.siigoSeleccion.set(next);
  }

  confirmarSincronizarSiigo(): void {
    const ids = [...this.siigoSeleccion()];
    if (!ids.length || this.syncingSiigo()) {
      return;
    }
    this.syncingSiigo.set(true);
    this.siigoSyncResult.set(null);
    this.siigoCatalogoError.set(null);
    this.codigosCiiuService.sincronizarSiigo(ids).subscribe({
      next: (result) => {
        this.syncingSiigo.set(false);
        this.siigoSyncResult.set(result);
        this.loadCodigosCiiu();
        const seleccion = new Set(ids);
        this.siigoCatalogo.set(
          this.siigoCatalogo().map((item) =>
            seleccion.has(item.id) ? { ...item, yaSincronizado: true } : item
          )
        );
      },
      error: (err) => {
        this.syncingSiigo.set(false);
        this.siigoCatalogoError.set(err.error?.message ?? 'No se pudieron sincronizar los grupos.');
      },
    });
  }

  private loadSiigoActivo(): void {
    this.configuracionSiigoService.get().subscribe({
      next: (config) => this.siigoActivo.set(!!config.activo),
      error: () => this.siigoActivo.set(false),
    });
  }
}
