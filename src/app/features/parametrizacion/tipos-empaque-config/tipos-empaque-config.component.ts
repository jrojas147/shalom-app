import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TiposEmpaqueService } from '../../../core/services/tipos-empaque.service';
import { TipoEmpaque, TipoEmpaqueRequest } from '../../../core/models/tipo-empaque.model';

@Component({
  selector: 'app-tipos-empaque-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tipos-empaque-config.component.html',
  styleUrl: './tipos-empaque-config.component.scss',
})
export class TiposEmpaqueConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tiposEmpaqueService = inject(TiposEmpaqueService);

  readonly tiposEmpaque = signal<TipoEmpaque[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    peso: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadTiposEmpaque();
  }

  loadTiposEmpaque(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tiposEmpaqueService.getAll().subscribe({
      next: (data) => {
        this.tiposEmpaque.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los tipos de empaque.');
        this.loading.set(false);
      },
    });
  }

  startEdit(tipo: TipoEmpaque): void {
    this.editingId.set(tipo.id);
    this.form.reset({ nombre: tipo.nombre, peso: tipo.peso });
    this.error.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ nombre: '', peso: null });
    this.error.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: TipoEmpaqueRequest = {
      nombre: raw.nombre.trim(),
      peso: raw.peso!,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.tiposEmpaqueService.update(id, request)
      : this.tiposEmpaqueService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.loadTiposEmpaque();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el tipo de empaque.');
      },
    });
  }

  deleteTipo(tipo: TipoEmpaque): void {
    if (!confirm(`¿Eliminar el tipo de empaque "${tipo.nombre}"?`)) {
      return;
    }

    this.tiposEmpaqueService.delete(tipo.id).subscribe({
      next: () => {
        if (this.editingId() === tipo.id) {
          this.cancelEdit();
        }
        this.loadTiposEmpaque();
      },
      error: (err) =>
        this.error.set(err.error?.message ?? 'No se pudo eliminar el tipo de empaque.'),
    });
  }

  formatPeso(peso: number): string {
    return `${peso.toLocaleString('es-AR', { maximumFractionDigits: 2 })} g`;
  }
}
