import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoGasto, TipoGastoRequest } from '../../../core/models/tipo-gasto.model';
import { TiposGastoService } from '../../../core/services/tipos-gasto.service';
import { RpConfirmDialogService } from '../../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';

@Component({
  selector: 'app-tipos-gasto-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tipos-gasto-config.component.html',
  styleUrl: './tipos-gasto-config.component.scss',
})
export class TiposGastoConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tiposGastoService = inject(TiposGastoService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly tiposGasto = signal<TipoGasto[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadTiposGasto();
  }

  loadTiposGasto(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tiposGastoService.getAll(true).subscribe({
      next: (data) => {
        this.tiposGasto.set((data ?? []).filter((tipo) => tipo.activo));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los tipos de gasto.');
        this.loading.set(false);
      },
    });
  }

  startEdit(tipo: TipoGasto): void {
    this.editingId.set(tipo.id);
    this.form.reset({ nombre: tipo.nombre, activo: tipo.activo });
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
    const request: TipoGastoRequest = {
      nombre: raw.nombre.trim(),
      activo: true,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.tiposGastoService.update(id, request)
      : this.tiposGastoService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.loadTiposGasto();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el tipo de gasto.');
      },
    });
  }

  deleteTipo(tipo: TipoGasto): void {
    if (!tipo.activo) {
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Eliminar tipo de gasto',
        message: `¿Eliminar el tipo de gasto "${tipo.nombre}"? Dejará de estar disponible para nuevos gastos.`,
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        confirmVariant: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.tiposGastoService.delete(tipo.id).subscribe({
          next: () => {
            if (this.editingId() === tipo.id) {
              this.cancelEdit();
            }
            this.loadTiposGasto();
          },
          error: (err) =>
            this.error.set(err.error?.message ?? 'No se pudo eliminar el tipo de gasto.'),
        });
      });
  }
}
