import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PROVEEDOR_TABS,
  Proveedor,
  ProveedorRequest,
  ProveedorTabConfig,
  TipoProveedor,
} from '../../core/models/proveedor.model';
import { ProveedoresService } from '../../core/services/proveedores.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [ReactiveFormsModule, RpModalComponent],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.scss',
})
export class ProveedoresComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly proveedoresService = inject(ProveedoresService);

  readonly tabs = PROVEEDOR_TABS;
  readonly proveedores = signal<Proveedor[]>([]);
  readonly tabActiva = signal<TipoProveedor>('INTERNO');
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly tabConfig = computed(
    () => this.tabs.find((tab) => tab.id === this.tabActiva()) ?? this.tabs[0]
  );

  readonly modalTitle = computed(() => {
    const verbo = this.editingId() ? 'Editar' : 'Nuevo';
    return `${verbo} proveedor — ${this.tabConfig().label}`;
  });

  readonly proveedoresFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const tipo = this.tabActiva();

    return this.proveedores()
      .filter((p) => p.tipo === tipo)
      .filter(
        (p) =>
          !q ||
          p.nombre.toLowerCase().includes(q) ||
          p.documento?.toLowerCase().includes(q) ||
          p.telefono?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
  });

  readonly conteoPorTab = computed(() => {
    const counts: Record<TipoProveedor, number> = {
      INTERNO: 0,
      EXTERNO: 0,
      EMPRESA: 0,
    };
    for (const proveedor of this.proveedores()) {
      counts[proveedor.tipo]++;
    }
    return counts;
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    documento: [''],
    telefono: [''],
    email: ['', Validators.email],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.proveedoresService.getAll().subscribe({
      next: (data) => {
        this.proveedores.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los proveedores.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: ProveedorTabConfig): void {
    if (this.tabActiva() === tab.id) {
      return;
    }
    this.tabActiva.set(tab.id);
    this.busqueda.set('');
    this.cancelForm();
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      nombre: '',
      documento: '',
      telefono: '',
      email: '',
      activo: true,
    });
    this.showForm.set(true);
    this.error.set(null);
  }

  openEdit(proveedor: Proveedor): void {
    this.tabActiva.set(proveedor.tipo);
    this.editingId.set(proveedor.id);
    this.form.reset({
      nombre: proveedor.nombre,
      documento: proveedor.documento ?? '',
      telefono: proveedor.telefono ?? '',
      email: proveedor.email ?? '',
      activo: proveedor.activo,
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
    const request: ProveedorRequest = {
      tipo: this.tabActiva(),
      nombre: raw.nombre.trim(),
      documento: raw.documento.trim() || undefined,
      telefono: raw.telefono.trim() || undefined,
      email: raw.email.trim() || undefined,
      activo: raw.activo,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.proveedoresService.update(id, request)
      : this.proveedoresService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.loadProveedores();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el proveedor.');
      },
    });
  }

  deleteProveedor(proveedor: Proveedor): void {
    if (!confirm(`¿Eliminar el proveedor "${proveedor.nombre}"?`)) {
      return;
    }

    this.proveedoresService.delete(proveedor.id).subscribe({
      next: () => {
        if (this.editingId() === proveedor.id) {
          this.cancelForm();
        }
        this.loadProveedores();
      },
      error: (err) =>
        this.error.set(err.error?.message ?? 'No se pudo eliminar el proveedor.'),
    });
  }
}
