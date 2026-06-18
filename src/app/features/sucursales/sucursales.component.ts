import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sucursal, SucursalRequest } from '../../core/models/sucursal.model';
import { SucursalesService } from '../../core/services/sucursales.service';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.scss',
})
export class SucursalesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sucursalesService = inject(SucursalesService);

  readonly sucursales = signal<Sucursal[]>([]);
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly sucursalesFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.sucursales();
    }
    return this.sucursales().filter(
      (s) =>
        s.nombre.toLowerCase().includes(q) ||
        s.codigo?.toLowerCase().includes(q) ||
        s.direccion?.toLowerCase().includes(q) ||
        s.telefono?.toLowerCase().includes(q)
    );
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    codigo: [''],
    direccion: [''],
    telefono: [''],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadSucursales();
  }

  loadSucursales(): void {
    this.loading.set(true);
    this.error.set(null);

    this.sucursalesService.getAll().subscribe({
      next: (data) => {
        this.sucursales.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las sucursales.');
        this.loading.set(false);
      },
    });
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      nombre: '',
      codigo: '',
      direccion: '',
      telefono: '',
      activo: true,
    });
    this.showForm.set(true);
    this.error.set(null);
  }

  openEdit(sucursal: Sucursal): void {
    this.editingId.set(sucursal.id);
    this.form.reset({
      nombre: sucursal.nombre,
      codigo: sucursal.codigo ?? '',
      direccion: sucursal.direccion ?? '',
      telefono: sucursal.telefono ?? '',
      activo: sucursal.activo,
    });
    this.showForm.set(true);
    this.error.set(null);
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
    const request: SucursalRequest = {
      nombre: raw.nombre.trim(),
      codigo: raw.codigo.trim() || undefined,
      direccion: raw.direccion.trim() || undefined,
      telefono: raw.telefono.trim() || undefined,
      activo: raw.activo,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.sucursalesService.update(id, request)
      : this.sucursalesService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.loadSucursales();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar la sucursal.');
      },
    });
  }

  deleteSucursal(sucursal: Sucursal): void {
    if (!confirm(`¿Eliminar la sucursal "${sucursal.nombre}"?`)) {
      return;
    }

    this.sucursalesService.delete(sucursal.id).subscribe({
      next: () => {
        if (this.editingId() === sucursal.id) {
          this.cancelForm();
        }
        this.loadSucursales();
      },
      error: (err) =>
        this.error.set(err.error?.message ?? 'No se pudo eliminar la sucursal.'),
    });
  }
}
