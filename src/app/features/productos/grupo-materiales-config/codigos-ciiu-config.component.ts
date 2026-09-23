import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CodigoCiiu,
  CodigoCiiuRequest,
  CodigoCiiuSiigoCatalogo,
  CodigoCiiuSiigoCodigo,
  CodigoCiiuSiigoItem,
  CodigoCiiuSiigoSyncResult,
} from '../../../core/models/codigo-ciiu.model';
import { Categoria } from '../../../core/models/categoria.model';
import { CategoriasService } from '../../../core/services/categorias.service';
import { CodigosCiiuService } from '../../../core/services/codigos-ciiu.service';
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
  private readonly categoriasService = inject(CategoriasService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly categorias = signal<Categoria[]>([]);
  readonly codigosCiiu = signal<CodigoCiiu[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly showSiigoModal = signal(false);
  readonly loadingSiigoCatalogo = signal(false);
  readonly syncingSiigo = signal(false);
  readonly siigoCatalogo = signal<CodigoCiiuSiigoItem[]>([]);
  readonly siigoSeleccion = signal<Set<string>>(new Set());
  readonly siigoBusqueda = signal('');
  readonly siigoCatalogoError = signal<string | null>(null);
  readonly siigoSyncResult = signal<CodigoCiiuSiigoSyncResult | null>(null);
  readonly siigoPagina = signal(1);
  readonly siigoTotal = signal(0);
  readonly siigoHayMas = signal(false);
  readonly loadingSiigoMas = signal(false);
  readonly showExisteModal = signal(false);
  readonly existeEnSiigo = signal<CodigoCiiuSiigoCodigo | null>(null);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    categoriaId: [null as number | null, Validators.required],
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
    this.loadCategorias();
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
    this.form.reset({
      codigo: item.codigo,
      nombre: item.nombre,
      categoriaId: item.categoriaId ?? null,
    });
    this.error.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ codigo: '', nombre: '', categoriaId: null });
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
      categoriaId: raw.categoriaId,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    if (id) {
      this.persist(id, request);
      return;
    }

    this.codigosCiiuService.consultarCodigoSiigo(request.codigo).subscribe({
      next: (res) => {
        if (res.existe) {
          this.saving.set(false);
          this.existeEnSiigo.set(res);
          this.showExisteModal.set(true);
          return;
        }
        this.persist(null, request);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo consultar el producto en Siigo.');
      },
    });
  }

  closeExisteModal(): void {
    this.showExisteModal.set(false);
    this.existeEnSiigo.set(null);
  }

  irASincronizar(): void {
    this.closeExisteModal();
    this.openSiigoModal();
  }

  private persist(id: number | null, request: CodigoCiiuRequest): void {
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
        message: item.siigoId
          ? `¿Eliminar el grupo "${item.codigo}"? Dejará de listarse aquí y se inactivará el producto en Siigo. El historial en productos se conserva.`
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
    if (this.loadingSiigoCatalogo() || this.syncingSiigo()) {
      return;
    }
    this.showSiigoModal.set(true);
    this.siigoCatalogo.set([]);
    this.siigoSeleccion.set(new Set());
    this.siigoBusqueda.set('');
    this.siigoCatalogoError.set(null);
    this.siigoSyncResult.set(null);
    this.siigoPagina.set(1);
    this.siigoTotal.set(0);
    this.siigoHayMas.set(false);
    this.cargarPaginaSiigo(1, false);
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
    this.siigoHayMas.set(false);
  }

  cargarMasSiigo(): void {
    if (!this.siigoHayMas() || this.loadingSiigoMas() || this.loadingSiigoCatalogo() || this.syncingSiigo()) {
      return;
    }
    this.cargarPaginaSiigo(this.siigoPagina() + 1, true);
  }

  private cargarPaginaSiigo(page: number, append: boolean): void {
    this.siigoCatalogoError.set(null);
    if (append) {
      this.loadingSiigoMas.set(true);
    } else {
      this.loadingSiigoCatalogo.set(true);
    }
    this.codigosCiiuService.listarSiigo(page).subscribe({
      next: (data) => this.applyPaginaSiigo(data, append),
      error: (err) => {
        this.loadingSiigoCatalogo.set(false);
        this.loadingSiigoMas.set(false);
        this.siigoCatalogoError.set(
          err.error?.message ?? 'No se pudieron consultar los productos de Siigo.'
        );
      },
    });
  }

  private applyPaginaSiigo(data: CodigoCiiuSiigoCatalogo, append: boolean): void {
    const items = data.items ?? [];
    if (append) {
      const seen = new Set(this.siigoCatalogo().map((item) => item.id));
      this.siigoCatalogo.set([...this.siigoCatalogo(), ...items.filter((item) => !seen.has(item.id))]);
    } else {
      this.siigoCatalogo.set(items);
    }
    this.siigoPagina.set(data.page);
    this.siigoTotal.set(data.total);
    this.siigoHayMas.set(!!data.hayMas);
    this.loadingSiigoCatalogo.set(false);
    this.loadingSiigoMas.set(false);
  }

  onSiigoBusquedaChange(value: string): void {
    this.siigoBusqueda.set(value);
  }

  siigoSeleccionado(id: string): boolean {
    return this.siigoSeleccion().has(id);
  }

  toggleSiigoItem(id: string, checked: boolean): void {
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
        this.siigoCatalogoError.set(err.error?.message ?? 'No se pudieron sincronizar los productos.');
      },
    });
  }

  private loadCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: (data) =>
        this.categorias.set(
          (data ?? []).filter((item) => item.estado === 'ACTIVO' && item.siigoAccountGroupId)
        ),
      error: () => this.categorias.set([]),
    });
  }
}
