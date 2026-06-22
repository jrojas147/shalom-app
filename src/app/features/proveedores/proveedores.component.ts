import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TIPOS_DOCUMENTO,
  TipoDocumento,
} from '../../core/models/administrador-conjunto.model';
import {
  ProveedorInterno,
  ProveedorInternoHijoRequest,
  ProveedorInternoRequest,
  RH_VALUES,
  Rh,
  Sexo,
  SEXOS,
} from '../../core/models/proveedor-interno.model';
import { PROVEEDOR_TABS, ProveedorTabConfig, TipoProveedor } from '../../core/models/proveedor.model';
import { Departamento, Municipio } from '../../core/models/ubicacion.model';
import { ProveedoresInternosService } from '../../core/services/proveedores-internos.service';
import { UbicacionesService } from '../../core/services/ubicaciones.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RpModalComponent],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.scss',
})
export class ProveedoresComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly proveedoresInternosService = inject(ProveedoresInternosService);
  private readonly ubicacionesService = inject(UbicacionesService);

  readonly tabs = PROVEEDOR_TABS;
  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly sexos = SEXOS;
  readonly rhValues = RH_VALUES;

  readonly internos = signal<ProveedorInterno[]>([]);
  readonly tabActiva = signal<TipoProveedor>('INTERNO');
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly showHijoForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly editingHijoIndex = signal<number | null>(null);
  readonly hijoFormError = signal<string | null>(null);
  readonly hijosSectionOpen = signal(false);
  readonly departamentos = signal<Departamento[]>([]);
  readonly municipios = signal<Municipio[]>([]);

  readonly tabConfig = computed(
    () => this.tabs.find((tab) => tab.id === this.tabActiva()) ?? this.tabs[0]
  );

  readonly esTabIntegrada = computed(() => this.tabActiva() === 'INTERNO');

  readonly modalTitle = computed(() => {
    const verbo = this.editingId() ? 'Editar' : 'Nuevo';
    return `${verbo} proveedor interno`;
  });

  readonly hijoModalTitle = computed(() =>
    this.editingHijoIndex() !== null ? 'Editar hijo' : 'Registrar hijo'
  );

  readonly internosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.internos();
    }
    return this.internos().filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.documento.toLowerCase().includes(q) ||
        p.tipoDocumento.toLowerCase().includes(q) ||
        p.telefono?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.nombreContacto?.toLowerCase().includes(q)
    );
  });

  readonly internoForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    tipoDocumento: ['CC' as TipoDocumento, Validators.required],
    documento: ['', Validators.required],
    fechaNacimiento: [''],
    sexo: ['' as Sexo | ''],
    email: ['', Validators.email],
    fechaIngreso: [''],
    arl: [''],
    eps: [''],
    telefono: [''],
    rh: ['' as Rh | ''],
    direccion: [''],
    departamentoId: [null as number | null],
    municipioId: [null as number | null],
    nombreContacto: [''],
    telefonoContacto: [''],
    activo: [true],
    hijos: this.fb.array<FormGroup>([]),
  });

  readonly hijoForm = this.fb.nonNullable.group({
    documento: ['', Validators.required],
    nombre: ['', Validators.required],
    sexo: ['' as Sexo | ''],
    fechaNacimiento: [''],
  });

  ngOnInit(): void {
    this.loadInternos();
    this.loadDepartamentos();
  }

  get hijosArray(): FormArray<FormGroup> {
    return this.internoForm.controls.hijos;
  }

  loadInternos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.proveedoresInternosService.getAll().subscribe({
      next: (data) => {
        this.internos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los proveedores internos.');
        this.loading.set(false);
      },
    });
  }

  loadDepartamentos(): void {
    this.ubicacionesService.getDepartamentos().subscribe({
      next: (departamentos) => this.departamentos.set(departamentos),
      error: () => this.departamentos.set([]),
    });
  }

  onDepartamentoChange(): void {
    const departamentoId = this.internoForm.controls.departamentoId.value;
    this.internoForm.patchValue({ municipioId: null });
    this.municipios.set([]);

    if (!departamentoId) {
      this.internoForm.controls.municipioId.disable();
      return;
    }

    this.internoForm.controls.municipioId.enable();
    this.ubicacionesService.getMunicipiosByDepartamento(departamentoId).subscribe({
      next: (municipios) => this.municipios.set(municipios),
      error: () => this.municipios.set([]),
    });
  }

  setTab(tab: ProveedorTabConfig): void {
    if (this.tabActiva() === tab.id) {
      return;
    }
    this.tabActiva.set(tab.id);
    this.busqueda.set('');
    this.cancelForm();
    if (tab.id === 'INTERNO') {
      this.loadInternos();
    }
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  toggleHijosSection(): void {
    this.hijosSectionOpen.update((open) => !open);
  }

  openHijoModal(index?: number): void {
    this.hijoFormError.set(null);
    this.editingHijoIndex.set(index ?? null);

    if (index !== undefined) {
      const raw = this.hijosArray.at(index).getRawValue();
      this.hijoForm.reset({
        documento: raw.documento,
        nombre: raw.nombre,
        sexo: raw.sexo,
        fechaNacimiento: raw.fechaNacimiento,
      });
    } else {
      this.hijoForm.reset({
        documento: '',
        nombre: '',
        sexo: '',
        fechaNacimiento: '',
      });
    }

    this.showHijoForm.set(true);
  }

  cancelHijoModal(): void {
    this.showHijoForm.set(false);
    this.editingHijoIndex.set(null);
    this.hijoFormError.set(null);
    this.hijoForm.reset({
      documento: '',
      nombre: '',
      sexo: '',
      fechaNacimiento: '',
    });
  }

  saveHijoModal(): void {
    if (this.hijoForm.invalid) {
      this.hijoForm.markAllAsTouched();
      return;
    }

    const raw = this.hijoForm.getRawValue();
    const documento = raw.documento.trim();
    const docKey = documento.toLowerCase();
    const editIndex = this.editingHijoIndex();

    const duplicate = this.hijosArray.controls.some((ctrl, i) => {
      if (editIndex !== null && i === editIndex) {
        return false;
      }
      return ctrl.getRawValue().documento.trim().toLowerCase() === docKey;
    });

    if (duplicate) {
      this.hijoFormError.set('Ya hay un hijo registrado con ese documento.');
      return;
    }

    const group = this.createHijoGroup({
      documento,
      nombre: raw.nombre.trim(),
      sexo: raw.sexo || undefined,
      fechaNacimiento: raw.fechaNacimiento || undefined,
    });

    if (editIndex !== null) {
      this.hijosArray.setControl(editIndex, group);
    } else {
      this.hijosArray.push(group);
    }

    this.hijosSectionOpen.set(true);
    this.cancelHijoModal();
  }

  removeHijoRow(index: number): void {
    if (this.editingHijoIndex() === index) {
      this.cancelHijoModal();
    }
    this.hijosArray.removeAt(index);
  }

  getHijoSexoLabel(sexo: string): string {
    return this.sexos.find((s) => s.value === sexo)?.label ?? '—';
  }

  getHijoAt(index: number): {
    documento: string;
    nombre: string;
    sexo: string;
    fechaNacimiento: string;
  } {
    return this.hijosArray.at(index).getRawValue();
  }

  openCreate(): void {
    if (!this.esTabIntegrada()) {
      return;
    }

    this.editingId.set(null);
    this.resetInternoForm();
    this.showForm.set(true);
    this.error.set(null);
  }

  openEdit(proveedor: ProveedorInterno): void {
    this.editingId.set(proveedor.id);
    this.resetInternoForm();
    this.internoForm.patchValue({
      nombre: proveedor.nombre,
      tipoDocumento: proveedor.tipoDocumento,
      documento: proveedor.documento,
      fechaNacimiento: proveedor.fechaNacimiento ?? '',
      sexo: proveedor.sexo ?? '',
      email: proveedor.email ?? '',
      fechaIngreso: proveedor.fechaIngreso ?? '',
      arl: proveedor.arl ?? '',
      eps: proveedor.eps ?? '',
      telefono: proveedor.telefono ?? '',
      rh: proveedor.rh ?? '',
      direccion: proveedor.direccion ?? '',
      nombreContacto: proveedor.nombreContacto ?? '',
      telefonoContacto: proveedor.telefonoContacto ?? '',
      activo: proveedor.activo,
    });

    proveedor.hijos.forEach((hijo) => this.hijosArray.push(this.createHijoGroup(hijo)));
    this.hijosSectionOpen.set(proveedor.hijos.length > 0);
    this.patchUbicacion(proveedor.departamento, proveedor.municipio);
    this.showForm.set(true);
    this.error.set(null);
  }

  cancelForm(): void {
    this.cancelHijoModal();
    this.showForm.set(false);
    this.editingId.set(null);
    this.hijosSectionOpen.set(false);
    this.error.set(null);
    this.resetInternoForm();
  }

  saveInterno(): void {
    if (this.internoForm.invalid) {
      this.internoForm.markAllAsTouched();
      return;
    }

    const raw = this.internoForm.getRawValue();
    const departamento = this.departamentos().find((d) => d.id === raw.departamentoId);
    const municipio = this.municipios().find((m) => m.id === raw.municipioId);

    const request: ProveedorInternoRequest = {
      nombre: raw.nombre.trim(),
      tipoDocumento: raw.tipoDocumento,
      documento: raw.documento.trim(),
      fechaNacimiento: raw.fechaNacimiento || undefined,
      sexo: raw.sexo || undefined,
      email: raw.email.trim() || undefined,
      fechaIngreso: raw.fechaIngreso || undefined,
      arl: raw.arl.trim() || undefined,
      eps: raw.eps.trim() || undefined,
      telefono: raw.telefono.trim() || undefined,
      rh: raw.rh || undefined,
      direccion: raw.direccion.trim() || undefined,
      departamento: departamento?.nombre,
      municipio: municipio?.nombre,
      nombreContacto: raw.nombreContacto.trim() || undefined,
      telefonoContacto: raw.telefonoContacto.trim() || undefined,
      activo: raw.activo,
      hijos: this.buildHijosRequest(),
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.proveedoresInternosService.update(id, request)
      : this.proveedoresInternosService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.resetInternoForm();
        this.loadInternos();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  deleteInterno(proveedor: ProveedorInterno): void {
    if (!confirm(`¿Eliminar el proveedor interno "${proveedor.nombre}"?`)) {
      return;
    }

    this.proveedoresInternosService.delete(proveedor.id).subscribe({
      next: () => {
        if (this.editingId() === proveedor.id) {
          this.cancelForm();
        }
        this.loadInternos();
      },
      error: (err) => this.error.set(this.extractErrorMessage(err)),
    });
  }

  formatDocumento(proveedor: ProveedorInterno): string {
    return `${proveedor.tipoDocumento} ${proveedor.documento}`;
  }

  private resetInternoForm(): void {
    this.hijosArray.clear();
    this.municipios.set([]);
    this.internoForm.reset({
      nombre: '',
      tipoDocumento: 'CC',
      documento: '',
      fechaNacimiento: '',
      sexo: '',
      email: '',
      fechaIngreso: '',
      arl: '',
      eps: '',
      telefono: '',
      rh: '',
      direccion: '',
      departamentoId: null,
      municipioId: null,
      nombreContacto: '',
      telefonoContacto: '',
      activo: true,
    });
    this.internoForm.controls.municipioId.disable();
  }

  private createHijoGroup(hijo?: {
    documento: string;
    nombre: string;
    sexo?: Sexo;
    fechaNacimiento?: string;
  }): FormGroup {
    return this.fb.nonNullable.group({
      documento: [hijo?.documento ?? '', Validators.required],
      nombre: [hijo?.nombre ?? '', Validators.required],
      sexo: [hijo?.sexo ?? ('' as Sexo | '')],
      fechaNacimiento: [hijo?.fechaNacimiento ?? ''],
    });
  }

  private buildHijosRequest(): ProveedorInternoHijoRequest[] {
    return this.hijosArray.controls.map((group) => {
      const raw = group.getRawValue();
      return {
        documento: raw.documento.trim(),
        nombre: raw.nombre.trim(),
        sexo: raw.sexo || undefined,
        fechaNacimiento: raw.fechaNacimiento || undefined,
      };
    });
  }

  private patchUbicacion(departamentoNombre?: string, municipioNombre?: string): void {
    if (!departamentoNombre) {
      return;
    }

    const departamento = this.departamentos().find(
      (d) => d.nombre.toLowerCase() === departamentoNombre.toLowerCase()
    );
    if (!departamento) {
      return;
    }

    this.internoForm.patchValue({ departamentoId: departamento.id });
    this.internoForm.controls.municipioId.enable();
    this.ubicacionesService.getMunicipiosByDepartamento(departamento.id).subscribe({
      next: (municipios) => {
        this.municipios.set(municipios);
        const municipio = municipios.find(
          (m) => m.nombre.toLowerCase() === (municipioNombre ?? '').toLowerCase()
        );
        this.internoForm.patchValue({ municipioId: municipio?.id ?? null });
      },
    });
  }

  private extractErrorMessage(err: { error?: { message?: string; errors?: Record<string, string> } }): string {
    if (err.error?.errors) {
      const first = Object.values(err.error.errors)[0];
      if (first) {
        return first;
      }
    }
    return err.error?.message ?? 'No se pudo completar la operación.';
  }
}
