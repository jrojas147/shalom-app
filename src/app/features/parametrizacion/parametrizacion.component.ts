import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TiposEmpaqueService } from '../../core/services/tipos-empaque.service';
import { TipoEmpaque, TipoEmpaqueRequest } from '../../core/models/tipo-empaque.model';

@Component({
  selector: 'app-parametrizacion',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './parametrizacion.component.html',
  styleUrl: './parametrizacion.component.scss',
})
export class ParametrizacionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tiposEmpaqueService = inject(TiposEmpaqueService);

  readonly tiposEmpaque = signal<TipoEmpaque[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    peso: [null as number | null, [Validators.required, Validators.min(0.001)]],
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

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ nombre: '', peso: null });
    this.showForm.set(true);
  }

  openEdit(tipo: TipoEmpaque): void {
    this.editingId.set(tipo.id);
    this.form.reset({ nombre: tipo.nombre, peso: tipo.peso });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
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
        this.showForm.set(false);
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
      next: () => this.loadTiposEmpaque(),
      error: (err) =>
        this.error.set(err.error?.message ?? 'No se pudo eliminar el tipo de empaque.'),
    });
  }

  formatPeso(peso: number): string {
    return `${peso.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
  }
}
