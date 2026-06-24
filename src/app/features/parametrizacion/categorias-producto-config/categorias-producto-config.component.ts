import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CategoriaProductoItem,
  CategoriaProductoRequest,
} from '../../../core/models/categoria-producto.model';
import { CategoriasProductoService } from '../../../core/services/categorias-producto.service';

@Component({
  selector: 'app-categorias-producto-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './categorias-producto-config.component.html',
  styleUrl: './categorias-producto-config.component.scss',
})
export class CategoriasProductoConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriasProductoService = inject(CategoriasProductoService);

  readonly categorias = signal<CategoriaProductoItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading.set(true);
    this.error.set(null);

    this.categoriasProductoService.getAll().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar las categorías de producto.');
        this.loading.set(false);
      },
    });
  }

  startEdit(categoria: CategoriaProductoItem): void {
    this.editingId.set(categoria.id);
    this.form.reset({ nombre: categoria.nombre, activo: categoria.activo });
    this.error.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ nombre: '', activo: true });
    this.error.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: CategoriaProductoRequest = {
      nombre: raw.nombre.trim(),
      activo: raw.activo,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.categoriasProductoService.update(id, request)
      : this.categoriasProductoService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.loadCategorias();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar la categoría de producto.');
      },
    });
  }

  deleteCategoria(categoria: CategoriaProductoItem): void {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    this.categoriasProductoService.delete(categoria.id).subscribe({
      next: () => {
        if (this.editingId() === categoria.id) {
          this.cancelEdit();
        }
        this.loadCategorias();
      },
      error: (err) =>
        this.error.set(err.error?.message ?? 'No se pudo eliminar la categoría de producto.'),
    });
  }
}
