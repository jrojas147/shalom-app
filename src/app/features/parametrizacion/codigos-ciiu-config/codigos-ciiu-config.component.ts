import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CodigoCiiu, CodigoCiiuRequest } from '../../../core/models/codigo-ciiu.model';
import { CodigosCiiuService } from '../../../core/services/codigos-ciiu.service';

@Component({
  selector: 'app-codigos-ciiu-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './codigos-ciiu-config.component.html',
  styleUrl: './codigos-ciiu-config.component.scss',
})
export class CodigosCiiuConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly codigosCiiuService = inject(CodigosCiiuService);

  readonly codigosCiiu = signal<CodigoCiiu[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.loadCodigosCiiu();
  }

  loadCodigosCiiu(): void {
    this.loading.set(true);
    this.error.set(null);

    this.codigosCiiuService.getAll().subscribe({
      next: (data) => {
        this.codigosCiiu.set(data);
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
    if (!confirm(`¿Eliminar el código CIIU "${item.codigo}"?`)) {
      return;
    }

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
  }
}
