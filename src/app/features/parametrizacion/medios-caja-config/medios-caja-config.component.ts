import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EntidadBancaria,
  formatEntidadBancariaLabel,
} from '../../../core/models/entidad-bancaria.model';
import {
  MEDIO_CAJA_TIPO_LABEL,
  MEDIO_CAJA_TIPOS_CREABLES,
  MedioCaja,
  MedioCajaRequest,
  MedioCajaTipo,
  medioCajaDetalle,
} from '../../../core/models/medio-caja.model';
import { EntidadesBancariasService } from '../../../core/services/entidades-bancarias.service';
import { MediosCajaService } from '../../../core/services/medios-caja.service';
import { RpConfirmDialogService } from '../../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';

@Component({
  selector: 'app-medios-caja-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './medios-caja-config.component.html',
  styleUrl: './medios-caja-config.component.scss',
})
export class MediosCajaConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mediosCajaService = inject(MediosCajaService);
  private readonly entidadesService = inject(EntidadesBancariasService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly tiposCreables = MEDIO_CAJA_TIPOS_CREABLES;
  readonly tipoLabel = MEDIO_CAJA_TIPO_LABEL;

  readonly medios = signal<MedioCaja[]>([]);
  readonly entidades = signal<EntidadBancaria[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly editingSistema = signal(false);

  readonly form = this.fb.nonNullable.group({
    tipo: [null as Exclude<MedioCajaTipo, 'EFECTIVO'> | null, Validators.required],
    nombre: ['', Validators.required],
    telefono: [''],
    numeroCuenta: [''],
    entidadBancariaId: [null as number | null],
  });

  ngOnInit(): void {
    this.loadMedios();
    this.entidadesService.getAll().subscribe({
      next: (data) => this.entidades.set(data ?? []),
      error: () => this.entidades.set([]),
    });
  }

  loadMedios(): void {
    this.loading.set(true);
    this.error.set(null);

    this.mediosCajaService.getAll(true).subscribe({
      next: (data) => {
        this.medios.set((data ?? []).filter((medio) => medio.activo));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los medios de pago.');
        this.loading.set(false);
      },
    });
  }

  onTipoChange(): void {
    const tipo = this.form.controls.tipo.value;
    if (!this.editingId()) {
      if (tipo === 'NEQUI' && !this.form.controls.nombre.value.trim()) {
        this.form.controls.nombre.setValue('Nequi');
      } else if (tipo === 'DAVIPLATA' && !this.form.controls.nombre.value.trim()) {
        this.form.controls.nombre.setValue('Daviplata');
      }
    }
  }

  startEdit(medio: MedioCaja): void {
    this.editingId.set(medio.id);
    this.editingSistema.set(medio.sistema);
    this.form.reset({
      tipo: medio.tipo === 'EFECTIVO' ? null : medio.tipo,
      nombre: medio.nombre,
      telefono: medio.telefono ?? '',
      numeroCuenta: medio.numeroCuenta ?? '',
      entidadBancariaId: medio.entidadBancariaId ?? null,
    });
    if (medio.tipo !== 'EFECTIVO') {
      this.form.controls.tipo.disable({ emitEvent: false });
    }
    this.error.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editingSistema.set(false);
    this.form.controls.tipo.enable({ emitEvent: false });
    this.form.reset({
      tipo: null,
      nombre: '',
      telefono: '',
      numeroCuenta: '',
      entidadBancariaId: null,
    });
    this.error.set(null);
  }

  save(): void {
    const editingSistema = this.editingSistema();
    if (editingSistema) {
      if (!this.form.controls.nombre.value.trim()) {
        this.form.controls.nombre.markAsTouched();
        return;
      }
    } else if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const editing = this.medios().find((item) => item.id === this.editingId());
    const tipo: MedioCajaTipo = editingSistema
      ? 'EFECTIVO'
      : (raw.tipo ?? editing?.tipo ?? 'NEQUI');

    if (!editingSistema && (tipo === 'NEQUI' || tipo === 'DAVIPLATA') && !raw.telefono.trim()) {
      this.error.set('Indique el número de teléfono de la billetera.');
      return;
    }
    if (!editingSistema && tipo === 'BANCO') {
      if (raw.entidadBancariaId == null) {
        this.error.set('Seleccione el banco.');
        return;
      }
      if (!raw.numeroCuenta.trim()) {
        this.error.set('Indique el número de cuenta.');
        return;
      }
    }

    const request: MedioCajaRequest = {
      tipo,
      nombre: raw.nombre.trim(),
      telefono: raw.telefono.trim() || null,
      numeroCuenta: raw.numeroCuenta.trim() || null,
      entidadBancariaId: raw.entidadBancariaId,
      activo: true,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.mediosCajaService.update(id, request)
      : this.mediosCajaService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.loadMedios();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el medio de pago.');
      },
    });
  }

  deleteMedio(medio: MedioCaja): void {
    if (medio.sistema) return;

    this.confirmDialog
      .confirm({
        title: 'Eliminar medio de pago',
        message: `¿Eliminar el medio "${medio.nombre}"? Dejará de estar disponible para caja y ventas.`,
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        confirmVariant: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.mediosCajaService.delete(medio.id).subscribe({
          next: () => {
            if (this.editingId() === medio.id) {
              this.cancelEdit();
            }
            this.loadMedios();
          },
          error: (err) =>
            this.error.set(err.error?.message ?? 'No se pudo eliminar el medio de pago.'),
        });
      });
  }

  muestraTelefono(): boolean {
    if (this.editingSistema()) return false;
    const tipo = this.form.controls.tipo.value;
    return tipo === 'NEQUI' || tipo === 'DAVIPLATA';
  }

  muestraBanco(): boolean {
    return !this.editingSistema() && this.form.controls.tipo.value === 'BANCO';
  }

  detalle(medio: MedioCaja): string {
    return medioCajaDetalle(medio);
  }

  bancoLabel(entidad: EntidadBancaria): string {
    return formatEntidadBancariaLabel(entidad);
  }
}
