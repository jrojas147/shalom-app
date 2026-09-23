import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Categoria,
  CategoriaRequest,
  CategoriaSiigoCatalogo,
  CategoriaSiigoItem,
  CategoriaSiigoSyncResult,
} from '../../../core/models/categoria.model';
import { CategoriasService } from '../../../core/services/categorias.service';
import { RpConfirmDialogService } from '../../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';
import { RpModalComponent } from '../../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-categorias-config',
  standalone: true,
  imports: [ReactiveFormsModule, RpModalComponent],
  templateUrl: './categorias-config.component.html',
  styleUrl: './categorias-config.component.scss',
})
export class CategoriasConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriasService = inject(CategoriasService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly categorias = signal<Categoria[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly showSiigoModal = signal(false);
  readonly loadingSiigoCatalogo = signal(false);
  readonly syncingSiigo = signal(false);
  readonly siigoCatalogo = signal<CategoriaSiigoItem[]>([]);
  readonly siigoSeleccion = signal<Set<number>>(new Set());
  readonly siigoBusqueda = signal('');
  readonly siigoCatalogoError = signal<string | null>(null);
  readonly siigoSyncResult = signal<CategoriaSiigoSyncResult | null>(null);
  readonly siigoPagina = signal(1);
  readonly siigoTotal = signal(0);
  readonly siigoHayMas = signal(false);
  readonly loadingSiigoMas = signal(false);

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
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading.set(true);
    this.error.set(null);
    this.categoriasService.getAll().subscribe({
      next: (data) => {
        this.categorias.set((data ?? []).filter((item) => item.estado === 'ACTIVO'));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar las categorías.');
        this.loading.set(false);
      },
    });
  }

  startEdit(item: Categoria): void {
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
    const request: CategoriaRequest = {
      codigo: raw.codigo.trim(),
      nombre: raw.nombre.trim(),
    };
    this.saving.set(true);
    this.error.set(null);
    const id = this.editingId();
    const op$ = id
      ? this.categoriasService.update(id, request)
      : this.categoriasService.create(request);
    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.loadCategorias();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar la categoría.');
      },
    });
  }

  deleteCategoria(item: Categoria): void {
    this.confirmDialog
      .confirm({
        title: 'Eliminar categoría',
        message: item.siigoAccountGroupId
          ? `¿Eliminar la categoría "${item.codigo}"? Dejará de listarse y se intentará quitar el grupo en Siigo.`
          : `¿Eliminar la categoría "${item.codigo}"? Dejará de listarse.`,
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        confirmVariant: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.categoriasService.delete(item.id).subscribe({
          next: () => {
            if (this.editingId() === item.id) {
              this.cancelEdit();
            }
            this.loadCategorias();
          },
          error: (err) =>
            this.error.set(err.error?.message ?? 'No se pudo eliminar la categoría.'),
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
    this.categoriasService.listarSiigo(page).subscribe({
      next: (data) => this.applyPaginaSiigo(data, append),
      error: (err) => {
        this.loadingSiigoCatalogo.set(false);
        this.loadingSiigoMas.set(false);
        this.siigoCatalogoError.set(
          err.error?.message ?? 'No se pudieron consultar las categorías de Siigo.'
        );
      },
    });
  }

  private applyPaginaSiigo(data: CategoriaSiigoCatalogo, append: boolean): void {
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
    this.categoriasService.sincronizarSiigo(ids).subscribe({
      next: (result) => {
        this.syncingSiigo.set(false);
        this.siigoSyncResult.set(result);
        this.loadCategorias();
        const seleccion = new Set(ids);
        this.siigoCatalogo.set(
          this.siigoCatalogo().map((item) =>
            seleccion.has(item.id) ? { ...item, yaSincronizado: true } : item
          )
        );
      },
      error: (err) => {
        this.syncingSiigo.set(false);
        this.siigoCatalogoError.set(
          err.error?.message ?? 'No se pudieron sincronizar las categorías.'
        );
      },
    });
  }

}
