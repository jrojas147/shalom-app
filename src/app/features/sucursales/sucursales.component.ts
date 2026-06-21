import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  AdministradorConjunto,
  AdministradorConjuntoRequest,
  formatAdministradorLabel,
  TIPOS_DOCUMENTO,
  TipoDocumento,
} from '../../core/models/administrador-conjunto.model';
import {
  Sucursal,
  SucursalRequest,
  TIPOS_CUENTA,
  TipoCuenta,
} from '../../core/models/sucursal.model';
import { Departamento, Municipio } from '../../core/models/ubicacion.model';
import { AdministradoresConjuntoService } from '../../core/services/administradores-conjunto.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { UbicacionesService } from '../../core/services/ubicaciones.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

type SucursalesTab = 'conjuntos' | 'administradores';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RpModalComponent],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.scss',
})
export class SucursalesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly administradoresService = inject(AdministradoresConjuntoService);
  private readonly ubicacionesService = inject(UbicacionesService);

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly tiposCuenta = TIPOS_CUENTA;
  readonly formatAdministradorLabel = formatAdministradorLabel;

  readonly tabActiva = signal<SucursalesTab>('conjuntos');
  readonly sucursales = signal<Sucursal[]>([]);
  readonly administradores = signal<AdministradorConjunto[]>([]);
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly departamentos = signal<Departamento[]>([]);
  readonly municipios = signal<Municipio[]>([]);

  readonly administradoresActivos = computed(() =>
    this.administradores().filter((a) => a.activo)
  );

  readonly conjuntoModalTitle = computed(() =>
    this.editingId() ? 'Editar conjunto' : 'Nuevo conjunto'
  );

  readonly administradorModalTitle = computed(() =>
    this.editingId() ? 'Editar administrador' : 'Nuevo administrador'
  );

  readonly sucursalesFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.sucursales();
    }
    return this.sucursales().filter((s) => this.matchesConjuntoSearch(s, q));
  });

  readonly administradoresFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.administradores();
    }
    return this.administradores().filter((a) => this.matchesAdministradorSearch(a, q));
  });

  readonly conjuntoForm = this.fb.nonNullable.group({
    administradorId: [null as number | null, Validators.required],
    nit: ['', Validators.required],
    nombre: ['', Validators.required],
    numApartamentos: [null as number | null, [Validators.required, Validators.min(1)]],
    email: ['', Validators.email],
    departamentoId: [null as number | null, Validators.required],
    municipioId: [null as number | null, Validators.required],
    direccion: ['', Validators.required],
    banco: [''],
    numeroCuenta: [''],
    tipoCuenta: ['' as TipoCuenta | ''],
    fechaAlta: [this.todayIso()],
    activo: [true],
  });

  readonly administradorForm = this.fb.nonNullable.group({
    tipoDocumento: ['CC' as TipoDocumento, Validators.required],
    documento: [
      '',
      [Validators.required, Validators.maxLength(10), Validators.pattern(/^\d+$/)],
    ],
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    telefono: ['', [Validators.maxLength(10), Validators.pattern(/^$|^3\d{0,9}$/)]],
    email: ['', Validators.email],
    fechaCumpleanos: [''],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadData();
    this.loadDepartamentos();
  }

  setTab(tab: SucursalesTab): void {
    if (this.tabActiva() === tab) {
      return;
    }
    this.tabActiva.set(tab);
    this.busqueda.set('');
    this.cancelForm();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      sucursales: this.sucursalesService.getAll(),
      administradores: this.administradoresService.getAll(),
    }).subscribe({
      next: ({ sucursales, administradores }) => {
        this.sucursales.set(sucursales);
        this.administradores.set(administradores);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudieron cargar los datos.');
        this.loading.set(false);
      },
    });
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  loadDepartamentos(): void {
    this.ubicacionesService.getDepartamentos().subscribe({
      next: (departamentos) => this.departamentos.set(departamentos),
      error: () => this.departamentos.set([]),
    });
  }

  onDepartamentoChange(resetMunicipio = true): void {
    const departamentoId = this.conjuntoForm.controls.departamentoId.value;
    if (resetMunicipio) {
      this.conjuntoForm.patchValue({ municipioId: null });
    }
    this.municipios.set([]);
    if (!departamentoId) {
      this.conjuntoForm.controls.municipioId.disable();
      return;
    }
    this.conjuntoForm.controls.municipioId.enable();
    this.ubicacionesService.getMunicipiosByDepartamento(departamentoId).subscribe({
      next: (municipios) => this.municipios.set(municipios),
      error: () => this.municipios.set([]),
    });
  }

  openCreateConjunto(): void {
    this.editingId.set(null);
    this.municipios.set([]);
    this.conjuntoForm.reset({
      administradorId: this.administradoresActivos()[0]?.id ?? null,
      nit: '',
      nombre: '',
      numApartamentos: null,
      email: '',
      departamentoId: null,
      municipioId: null,
      direccion: '',
      banco: '',
      numeroCuenta: '',
      tipoCuenta: '',
      fechaAlta: this.todayIso(),
      activo: true,
    });
    this.conjuntoForm.controls.municipioId.disable();
    this.showForm.set(true);
    this.error.set(null);
  }

  openEditConjunto(sucursal: Sucursal): void {
    this.editingId.set(sucursal.id);
    this.municipios.set([]);
    this.conjuntoForm.reset({
      administradorId: sucursal.administradorId,
      nit: sucursal.nit,
      nombre: sucursal.nombre,
      numApartamentos: sucursal.numApartamentos,
      email: sucursal.email ?? '',
      departamentoId: null,
      municipioId: null,
      direccion: sucursal.direccion,
      banco: sucursal.banco ?? '',
      numeroCuenta: sucursal.numeroCuenta ?? '',
      tipoCuenta: sucursal.tipoCuenta ?? '',
      fechaAlta: sucursal.fechaAlta,
      activo: sucursal.activo,
    });
    this.conjuntoForm.controls.municipioId.disable();
    this.patchConjuntoUbicacion(sucursal.departamento, sucursal.municipio);
    this.showForm.set(true);
    this.error.set(null);
  }

  irACrearAdministrador(): void {
    this.editingId.set(null);
    this.tabActiva.set('administradores');
    this.busqueda.set('');
    this.openCreateAdministrador();
  }

  openCreateAdministrador(): void {
    this.editingId.set(null);
    this.administradorForm.reset({
      tipoDocumento: 'CC',
      documento: '',
      nombre: '',
      telefono: '',
      email: '',
      fechaCumpleanos: '',
      activo: true,
    });
    this.showForm.set(true);
    this.error.set(null);
  }

  openEditAdministrador(admin: AdministradorConjunto): void {
    this.editingId.set(admin.id);
    this.administradorForm.reset({
      tipoDocumento: admin.tipoDocumento,
      documento: admin.documento,
      nombre: admin.nombre,
      telefono: admin.telefono ?? '',
      email: admin.email ?? '',
      fechaCumpleanos: admin.fechaCumpleanos ?? '',
      activo: admin.activo,
    });
    this.showForm.set(true);
    this.error.set(null);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.error.set(null);
  }

  saveConjunto(): void {
    if (this.conjuntoForm.invalid) {
      this.conjuntoForm.markAllAsTouched();
      return;
    }

    const raw = this.conjuntoForm.getRawValue();
    const departamento = this.departamentos().find((d) => d.id === raw.departamentoId);
    const municipio = this.municipios().find((m) => m.id === raw.municipioId);
    if (!departamento || !municipio) {
      this.error.set('Seleccione un departamento y un municipio válidos.');
      return;
    }

    const request: SucursalRequest = {
      administradorId: raw.administradorId!,
      nit: raw.nit.trim(),
      nombre: raw.nombre.trim(),
      numApartamentos: raw.numApartamentos!,
      email: raw.email.trim() || undefined,
      departamento: departamento.nombre,
      municipio: municipio.nombre,
      direccion: raw.direccion.trim(),
      banco: raw.banco.trim() || undefined,
      numeroCuenta: raw.numeroCuenta.trim() || undefined,
      tipoCuenta: raw.tipoCuenta || undefined,
      fechaAlta: raw.fechaAlta || undefined,
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
        this.cancelForm();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el conjunto.');
      },
    });
  }

  saveAdministrador(): void {
    if (this.administradorForm.invalid) {
      this.administradorForm.markAllAsTouched();
      return;
    }

    const raw = this.administradorForm.getRawValue();
    const request: AdministradorConjuntoRequest = {
      tipoDocumento: raw.tipoDocumento,
      documento: raw.documento.trim(),
      nombre: raw.nombre.trim().toUpperCase(),
      telefono: raw.telefono.trim() || undefined,
      email: raw.email.trim() || undefined,
      fechaCumpleanos: raw.fechaCumpleanos || undefined,
      activo: raw.activo,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.administradoresService.update(id, request)
      : this.administradoresService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el administrador.');
      },
    });
  }

  normalizarNombreAdministrador(): void {
    const control = this.administradorForm.controls.nombre;
    const normalizado = control.value.trim().toUpperCase();
    if (normalizado !== control.value) {
      control.setValue(normalizado);
    }
  }

  limitarDocumentoAdministrador(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, 10);
    if (soloDigitos !== input.value) {
      this.administradorForm.controls.documento.setValue(soloDigitos);
    }
  }

  limitarTelefonoAdministrador(event: Event): void {
    const input = event.target as HTMLInputElement;
    let soloDigitos = input.value.replace(/\D/g, '').slice(0, 10);
    if (soloDigitos.length > 0 && soloDigitos[0] !== '3') {
      soloDigitos = '';
    }
    if (soloDigitos !== input.value) {
      this.administradorForm.controls.telefono.setValue(soloDigitos);
    }
  }

  deleteConjunto(sucursal: Sucursal): void {
    if (!confirm(`¿Eliminar el conjunto "${sucursal.nombre}"?`)) {
      return;
    }

    this.sucursalesService.delete(sucursal.id).subscribe({
      next: () => {
        if (this.editingId() === sucursal.id) {
          this.cancelForm();
        }
        this.loadData();
      },
      error: (err) =>
        this.error.set(err.error?.message ?? 'No se pudo eliminar el conjunto.'),
    });
  }

  deleteAdministrador(admin: AdministradorConjunto): void {
    if (!confirm(`¿Eliminar el administrador "${admin.nombre}"?`)) {
      return;
    }

    this.administradoresService.delete(admin.id).subscribe({
      next: () => {
        if (this.editingId() === admin.id) {
          this.cancelForm();
        }
        this.loadData();
      },
      error: (err) =>
        this.error.set(err.error?.message ?? 'No se pudo eliminar el administrador.'),
    });
  }

  formatFecha(fecha?: string): string {
    if (!fecha) {
      return '—';
    }
    const [year, month, day] = fecha.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-CO');
  }

  administradorNombre(sucursal: Sucursal): string {
    return sucursal.administrador?.nombre ?? '—';
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private patchConjuntoUbicacion(departamentoNombre: string, municipioNombre: string): void {
    const departamento = this.departamentos().find(
      (d) => d.nombre.toLowerCase() === departamentoNombre.toLowerCase()
    );
    if (!departamento) {
      return;
    }

    this.conjuntoForm.patchValue({ departamentoId: departamento.id });
    this.conjuntoForm.controls.municipioId.enable();
    this.ubicacionesService.getMunicipiosByDepartamento(departamento.id).subscribe({
      next: (municipios) => {
        this.municipios.set(municipios);
        const municipio = municipios.find(
          (m) => m.nombre.toLowerCase() === municipioNombre.toLowerCase()
        );
        this.conjuntoForm.patchValue({ municipioId: municipio?.id ?? null });
      },
    });
  }

  private matchesConjuntoSearch(s: Sucursal, q: string): boolean {
    return (
      s.nombre.toLowerCase().includes(q) ||
      s.nit.toLowerCase().includes(q) ||
      s.municipio.toLowerCase().includes(q) ||
      s.departamento.toLowerCase().includes(q) ||
      s.direccion.toLowerCase().includes(q) ||
      s.administrador?.nombre.toLowerCase().includes(q) ||
      s.administrador?.documento.toLowerCase().includes(q) ||
      false
    );
  }

  private matchesAdministradorSearch(a: AdministradorConjunto, q: string): boolean {
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.documento.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.telefono?.toLowerCase().includes(q) ||
      false
    );
  }
}
