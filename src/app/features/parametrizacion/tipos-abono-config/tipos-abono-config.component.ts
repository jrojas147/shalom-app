import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoAbono, TipoAbonoRequest } from '../../../core/models/tipo-abono.model';
import { TiposAbonoService } from '../../../core/services/tipos-abono.service';
import { RpConfirmDialogService } from '../../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';

@Component({
  selector: 'app-tipos-abono-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tipos-abono-config.component.html',
  styleUrl: './tipos-abono-config.component.scss',
})
export class TiposAbonoConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tiposAbonoService = inject(TiposAbonoService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly tiposAbono = signal<TipoAbono[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadTiposAbono();
  }

  loadTiposAbono(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tiposAbonoService.getAll(true).subscribe({
      next: (data) => {
        this.tiposAbono.set((data ?? []).filter((tipo) => tipo.activo));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los tipos de abono.');
        this.loading.set(false);
      },
    });
  }

  startEdit(tipo: TipoAbono): void {
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
    const request: TipoAbonoRequest = {
      nombre: raw.nombre.trim(),
      activo: true,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.tiposAbonoService.update(id, request)
      : this.tiposAbonoService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.loadTiposAbono();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el tipo de abono.');
      },
    });
  }

  deleteTipo(tipo: TipoAbono): void {
    if (!tipo.activo) {
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Eliminar tipo de abono',
        message: `¿Eliminar el tipo de abono "${tipo.nombre}"? Dejará de estar disponible para nuevos abonos.`,
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        confirmVariant: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.tiposAbonoService.delete(tipo.id).subscribe({
          next: () => {
            if (this.editingId() === tipo.id) {
              this.cancelEdit();
            }
            this.loadTiposAbono();
          },
          error: (err) =>
            this.error.set(err.error?.message ?? 'No se pudo eliminar el tipo de abono.'),
        });
      });
  }
}
