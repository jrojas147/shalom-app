import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TiposEmpaqueService } from '../../../core/services/tipos-empaque.service';
import { TipoEmpaque, TipoEmpaqueRequest } from '../../../core/models/tipo-empaque.model';
import { RpConfirmDialogService } from '../../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';

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
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly tiposEmpaque = signal<TipoEmpaque[]>([]);
  readonly inactivos = signal<TipoEmpaque[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    peso: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.loadTiposEmpaque();
  }

  loadTiposEmpaque(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tiposEmpaqueService.getAll(false).subscribe({
      next: (data) => {
        const todos = data ?? [];
        this.tiposEmpaque.set(todos.filter((tipo) => tipo.activo !== false));
        this.inactivos.set(todos.filter((tipo) => tipo.activo === false));
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
    this.mensaje.set(
      tipo.activo === false
        ? 'Este tipo de empaque está inactivo. Al guardar se reactivará con los datos del formulario.'
        : null
    );
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ nombre: '', peso: null });
    this.error.set(null);
    this.mensaje.set(null);
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
    const id = this.editingId();

    if (!id) {
      const inactivo = this.buscarInactivoPorNombre(request.nombre);
      if (inactivo) {
        this.confirmDialog
          .confirm({
            title: 'Reactivar tipo de empaque',
            message: `El tipo "${inactivo.nombre}" está inactivo. ¿Desea reactivarlo con el peso indicado?`,
            confirmLabel: 'Reactivar',
            cancelLabel: 'Cancelar',
          })
          .subscribe((ok) => {
            if (!ok) {
              return;
            }
            this.persist(inactivo.id, request);
          });
        return;
      }
    }

    this.persist(id, request);
  }

  deleteTipo(tipo: TipoEmpaque): void {
    if (tipo.activo === false) {
      return;
    }

    this.confirmDialog
      .confirm({
        title: 'Eliminar tipo de empaque',
        message: `¿Eliminar el tipo de empaque "${tipo.nombre}"? Dejará de estar disponible en compras y ventas.`,
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        confirmVariant: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.tiposEmpaqueService.delete(tipo.id).subscribe({
          next: () => {
            if (this.editingId() === tipo.id) {
              this.cancelEdit();
            }
            this.loadTiposEmpaque();
          },
          error: (err) =>
            this.error.set(
              err.error?.message ?? 'No se pudo eliminar el tipo de empaque.'
            ),
        });
      });
  }

  formatPeso(peso: number): string {
    return `${peso.toLocaleString('es-AR', { maximumFractionDigits: 3 })} kg`;
  }

  private buscarInactivoPorNombre(nombre: string): TipoEmpaque | undefined {
    const normalizado = nombre.trim().toLowerCase();
    return this.inactivos().find((tipo) => tipo.nombre.trim().toLowerCase() === normalizado);
  }

  private persist(id: number | null, request: TipoEmpaqueRequest): void {
    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);

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
}
