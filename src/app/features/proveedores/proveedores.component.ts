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
  ProveedorEmpresa,
  ProveedorEmpresaRequest,
  TIPOS_PAGO,
  TipoPago,
} from '../../core/models/proveedor-empresa.model';
import {
  ProveedorExterno,
  ProveedorExternoRequest,
} from '../../core/models/proveedor-externo.model';
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
import { TIPOS_CUENTA, TipoCuenta } from '../../core/models/sucursal.model';
import { Departamento, Municipio } from '../../core/models/ubicacion.model';
import { EntidadesBancariasService } from '../../core/services/entidades-bancarias.service';
import { ProveedoresEmpresasService } from '../../core/services/proveedores-empresas.service';
import { ProveedoresExternosService } from '../../core/services/proveedores-externos.service';
import { ProveedoresInternosService } from '../../core/services/proveedores-internos.service';
import { SucursalesService } from '../../core/services/sucursales.service';
import { UbicacionesService } from '../../core/services/ubicaciones.service';
import { EntidadBancaria } from '../../core/models/entidad-bancaria.model';
import { Sucursal } from '../../core/models/sucursal.model';
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
  private readonly proveedoresExternosService = inject(ProveedoresExternosService);
  private readonly proveedoresEmpresasService = inject(ProveedoresEmpresasService);
  private readonly ubicacionesService = inject(UbicacionesService);
  private readonly entidadesBancariasService = inject(EntidadesBancariasService);
  private readonly sucursalesService = inject(SucursalesService);

  readonly tabs = PROVEEDOR_TABS;
  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly sexos = SEXOS;
  readonly rhValues = RH_VALUES;
  readonly tiposPago = TIPOS_PAGO;
  readonly tiposCuenta = TIPOS_CUENTA;

  readonly internos = signal<ProveedorInterno[]>([]);
  readonly externos = signal<ProveedorExterno[]>([]);
  readonly empresas = signal<ProveedorEmpresa[]>([]);
  readonly entidadesBancarias = signal<EntidadBancaria[]>([]);
  readonly sucursales = signal<Sucursal[]>([]);
  readonly selectedRecicladorIds = signal<number[]>([]);
  readonly selectedSucursalIds = signal<number[]>([]);
  readonly tabActiva = signal<TipoProveedor>('INTERNO');
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly showHijoForm = signal(false);
  readonly showRecicladoresModal = signal(false);
  readonly showSucursalesModal = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly editingHijoIndex = signal<number | null>(null);
  readonly hijoFormError = signal<string | null>(null);
  readonly hijosSectionOpen = signal(false);
  readonly departamentos = signal<Departamento[]>([]);
  readonly municipios = signal<Municipio[]>([]);
  readonly empresaMunicipios = signal<Municipio[]>([]);

  readonly tabConfig = computed(
    () => this.tabs.find((tab) => tab.id === this.tabActiva()) ?? this.tabs[0]
  );

  readonly esTabInterna = computed(() => this.tabActiva() === 'INTERNO');
  readonly esTabExterna = computed(() => this.tabActiva() === 'EXTERNO');
  readonly esTabEmpresa = computed(() => this.tabActiva() === 'EMPRESA');
  readonly esTabIntegrada = computed(
    () => this.esTabInterna() || this.esTabExterna() || this.esTabEmpresa()
  );

  readonly internosActivos = computed(() => this.internos().filter((p) => p.activo));

  readonly sucursalesActivas = computed(() => this.sucursales().filter((s) => s.activo));

  readonly sucursalesSeleccionadas = computed(() => {
    const ids = new Set(this.selectedSucursalIds());
    return this.sucursales().filter((s) => ids.has(s.id));
  });

  readonly recicladoresSeleccionados = computed(() => {
    const ids = new Set(this.selectedRecicladorIds());
    return this.internos().filter((p) => ids.has(p.id));
  });

  readonly modalTitle = computed(() => {
    if (this.esTabEmpresa()) {
      return this.editingId() ? 'Editar empresa proveedora' : 'Nueva empresa proveedora';
    }
    const verbo = this.editingId() ? 'Editar' : 'Nuevo';
    const tipo = this.esTabExterna() ? 'externo' : 'interno';
    return `${verbo} proveedor ${tipo}`;
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

  readonly externosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.externos();
    }
    return this.externos().filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.documento.toLowerCase().includes(q) ||
        p.tipoDocumento.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.nombreContacto?.toLowerCase().includes(q) ||
        p.telefonoContacto?.toLowerCase().includes(q)
    );
  });

  readonly empresasFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.empresas();
    }
    return this.empresas().filter(
      (e) =>
        e.razonSocial.toLowerCase().includes(q) ||
        e.nit.toLowerCase().includes(q) ||
        e.personaContacto?.toLowerCase().includes(q) ||
        e.telefonoContacto?.toLowerCase().includes(q) ||
        e.departamento?.toLowerCase().includes(q) ||
        e.municipio?.toLowerCase().includes(q)
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

  readonly externoForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    tipoDocumento: ['CC' as TipoDocumento, Validators.required],
    documento: ['', Validators.required],
    email: ['', Validators.email],
    nombreContacto: [''],
    telefonoContacto: [''],
    activo: [true],
  });

  readonly empresaForm = this.fb.nonNullable.group({
    nit: ['', Validators.required],
    razonSocial: ['', Validators.required],
    personaContacto: [''],
    telefonoContacto: [''],
    departamentoId: [null as number | null],
    municipioId: [null as number | null],
    direccion: [''],
    tipoPago: ['' as TipoPago | ''],
    entidadBancariaId: [null as number | null],
    tipoCuenta: ['' as TipoCuenta | ''],
    numeroCuenta: [''],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadInternos();
    this.loadDepartamentos();
    this.loadEntidadesBancarias();
    this.loadSucursales();
    this.empresaForm.controls.municipioId.disable();
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

  loadExternos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.proveedoresExternosService.getAll().subscribe({
      next: (data) => {
        this.externos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los proveedores externos.');
        this.loading.set(false);
      },
    });
  }

  loadEmpresas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.proveedoresEmpresasService.getAll().subscribe({
      next: (data) => {
        this.empresas.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las empresas proveedoras.');
        this.loading.set(false);
      },
    });
  }

  loadEntidadesBancarias(): void {
    this.entidadesBancariasService.getAll().subscribe({
      next: (entidades) => this.entidadesBancarias.set(entidades),
      error: () => this.entidadesBancarias.set([]),
    });
  }

  loadSucursales(): void {
    this.sucursalesService.getAll(true).subscribe({
      next: (data) => this.sucursales.set(data),
      error: () => this.sucursales.set([]),
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

  onEmpresaDepartamentoChange(): void {
    const departamentoId = this.empresaForm.controls.departamentoId.value;
    this.empresaForm.patchValue({ municipioId: null });
    this.empresaMunicipios.set([]);

    if (!departamentoId) {
      this.empresaForm.controls.municipioId.disable();
      return;
    }

    this.empresaForm.controls.municipioId.enable();
    this.ubicacionesService.getMunicipiosByDepartamento(departamentoId).subscribe({
      next: (municipios) => this.empresaMunicipios.set(municipios),
      error: () => this.empresaMunicipios.set([]),
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
      this.loadSucursales();
    } else if (tab.id === 'EXTERNO') {
      this.loadExternos();
    } else if (tab.id === 'EMPRESA') {
      this.loadEmpresas();
      if (this.internos().length === 0) {
        this.proveedoresInternosService.getAll().subscribe({
          next: (data) => this.internos.set(data),
          error: () => this.internos.set([]),
        });
      }
    }
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  toggleHijosSection(): void {
    this.hijosSectionOpen.update((open) => !open);
  }

  openRecicladoresModal(): void {
    this.ensureInternosLoaded(() => this.showRecicladoresModal.set(true));
  }

  closeRecicladoresModal(): void {
    this.showRecicladoresModal.set(false);
  }

  openSucursalesModal(): void {
    if (this.sucursales().length === 0) {
      this.loadSucursales();
    }
    this.showSucursalesModal.set(true);
  }

  closeSucursalesModal(): void {
    this.showSucursalesModal.set(false);
  }

  isSucursalSelected(sucursalId: number): boolean {
    return this.selectedSucursalIds().includes(sucursalId);
  }

  toggleSucursal(sucursalId: number): void {
    this.selectedSucursalIds.update((ids) =>
      ids.includes(sucursalId)
        ? ids.filter((id) => id !== sucursalId)
        : [...ids, sucursalId]
    );
  }

  removeSucursal(sucursalId: number): void {
    this.selectedSucursalIds.update((ids) => ids.filter((id) => id !== sucursalId));
  }

  isRecicladorSelected(recicladorId: number): boolean {
    return this.selectedRecicladorIds().includes(recicladorId);
  }

  toggleReciclador(recicladorId: number): void {
    this.selectedRecicladorIds.update((ids) =>
      ids.includes(recicladorId)
        ? ids.filter((id) => id !== recicladorId)
        : [...ids, recicladorId]
    );
  }

  removeReciclador(recicladorId: number): void {
    this.selectedRecicladorIds.update((ids) => ids.filter((id) => id !== recicladorId));
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
    if (this.esTabEmpresa()) {
      this.resetEmpresaForm();
      this.ensureInternosLoaded();
    } else if (this.esTabExterna()) {
      this.resetExternoForm();
    } else {
      this.resetInternoForm();
      this.loadSucursales();
    }
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
    this.selectedSucursalIds.set(
      proveedor.sucursalesAsociadas.map((s) => s.sucursalId)
    );
    this.patchUbicacion(proveedor.departamento, proveedor.municipio);
    this.showForm.set(true);
    this.error.set(null);
  }

  openEditExterno(proveedor: ProveedorExterno): void {
    this.editingId.set(proveedor.id);
    this.resetExternoForm();
    this.externoForm.patchValue({
      nombre: proveedor.nombre,
      tipoDocumento: proveedor.tipoDocumento,
      documento: proveedor.documento,
      email: proveedor.email ?? '',
      nombreContacto: proveedor.nombreContacto ?? '',
      telefonoContacto: proveedor.telefonoContacto ?? '',
      activo: proveedor.activo,
    });
    this.showForm.set(true);
    this.error.set(null);
  }

  openEditEmpresa(empresa: ProveedorEmpresa): void {
    this.editingId.set(empresa.id);
    this.resetEmpresaForm();
    this.empresaForm.patchValue({
      nit: empresa.nit,
      razonSocial: empresa.razonSocial,
      personaContacto: empresa.personaContacto ?? '',
      telefonoContacto: empresa.telefonoContacto ?? '',
      direccion: empresa.direccion ?? '',
      tipoPago: empresa.tipoPago ?? '',
      entidadBancariaId: empresa.entidadBancariaId ?? null,
      tipoCuenta: empresa.tipoCuenta ?? '',
      numeroCuenta: empresa.numeroCuenta ?? '',
      activo: empresa.activo,
    });
    this.selectedRecicladorIds.set(
      empresa.recicladoresAsociados.map((r) => r.recicladorId)
    );
    this.ensureInternosLoaded();
    this.patchEmpresaUbicacion(empresa.departamento, empresa.municipio);
    this.showForm.set(true);
    this.error.set(null);
  }

  cancelForm(): void {
    this.cancelHijoModal();
    this.closeRecicladoresModal();
    this.closeSucursalesModal();
    this.showForm.set(false);
    this.editingId.set(null);
    this.hijosSectionOpen.set(false);
    this.error.set(null);
    this.resetInternoForm();
    this.resetExternoForm();
    this.resetEmpresaForm();
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
      sucursalIds: this.selectedSucursalIds(),
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

  saveExterno(): void {
    if (this.externoForm.invalid) {
      this.externoForm.markAllAsTouched();
      return;
    }

    const raw = this.externoForm.getRawValue();
    const request: ProveedorExternoRequest = {
      nombre: raw.nombre.trim(),
      tipoDocumento: raw.tipoDocumento,
      documento: raw.documento.trim(),
      email: raw.email.trim() || undefined,
      nombreContacto: raw.nombreContacto.trim() || undefined,
      telefonoContacto: raw.telefonoContacto.trim() || undefined,
      activo: raw.activo,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.proveedoresExternosService.update(id, request)
      : this.proveedoresExternosService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.resetExternoForm();
        this.loadExternos();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  saveEmpresa(): void {
    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    const raw = this.empresaForm.getRawValue();
    const departamento = this.departamentos().find((d) => d.id === raw.departamentoId);
    const municipio = this.empresaMunicipios().find((m) => m.id === raw.municipioId);

    const request: ProveedorEmpresaRequest = {
      nit: raw.nit.trim(),
      razonSocial: raw.razonSocial.trim(),
      personaContacto: raw.personaContacto.trim() || undefined,
      telefonoContacto: raw.telefonoContacto.trim() || undefined,
      departamento: departamento?.nombre,
      municipio: municipio?.nombre,
      direccion: raw.direccion.trim() || undefined,
      tipoPago: raw.tipoPago || undefined,
      entidadBancariaId: raw.entidadBancariaId ?? undefined,
      tipoCuenta: raw.tipoCuenta || undefined,
      numeroCuenta: raw.numeroCuenta.trim() || undefined,
      activo: raw.activo,
      recicladorIds: this.selectedRecicladorIds(),
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.proveedoresEmpresasService.update(id, request)
      : this.proveedoresEmpresasService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.resetEmpresaForm();
        this.loadEmpresas();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  deleteEmpresa(empresa: ProveedorEmpresa): void {
    if (!confirm(`¿Eliminar la empresa "${empresa.razonSocial}"?`)) {
      return;
    }

    this.proveedoresEmpresasService.delete(empresa.id).subscribe({
      next: () => {
        if (this.editingId() === empresa.id) {
          this.cancelForm();
        }
        this.loadEmpresas();
      },
      error: (err) => this.error.set(this.extractErrorMessage(err)),
    });
  }

  deleteExterno(proveedor: ProveedorExterno): void {
    if (!confirm(`¿Eliminar el proveedor externo "${proveedor.nombre}"?`)) {
      return;
    }

    this.proveedoresExternosService.delete(proveedor.id).subscribe({
      next: () => {
        if (this.editingId() === proveedor.id) {
          this.cancelForm();
        }
        this.loadExternos();
      },
      error: (err) => this.error.set(this.extractErrorMessage(err)),
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

  formatDocumento(proveedor: ProveedorInterno | ProveedorExterno): string {
    return `${proveedor.tipoDocumento} ${proveedor.documento}`;
  }

  private resetEmpresaForm(): void {
    this.empresaMunicipios.set([]);
    this.selectedRecicladorIds.set([]);
    this.empresaForm.reset({
      nit: '',
      razonSocial: '',
      personaContacto: '',
      telefonoContacto: '',
      departamentoId: null,
      municipioId: null,
      direccion: '',
      tipoPago: '',
      entidadBancariaId: null,
      tipoCuenta: '',
      numeroCuenta: '',
      activo: true,
    });
    this.empresaForm.controls.municipioId.disable();
  }

  private resetExternoForm(): void {
    this.externoForm.reset({
      nombre: '',
      tipoDocumento: 'CC',
      documento: '',
      email: '',
      nombreContacto: '',
      telefonoContacto: '',
      activo: true,
    });
  }

  private resetInternoForm(): void {
    this.hijosArray.clear();
    this.selectedSucursalIds.set([]);
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

  private patchEmpresaUbicacion(departamentoNombre?: string, municipioNombre?: string): void {
    if (!departamentoNombre) {
      return;
    }

    const departamento = this.departamentos().find(
      (d) => d.nombre.toLowerCase() === departamentoNombre.toLowerCase()
    );
    if (!departamento) {
      return;
    }

    this.empresaForm.patchValue({ departamentoId: departamento.id });
    this.empresaForm.controls.municipioId.enable();
    this.ubicacionesService.getMunicipiosByDepartamento(departamento.id).subscribe({
      next: (municipios) => {
        this.empresaMunicipios.set(municipios);
        const municipio = municipios.find(
          (m) => m.nombre.toLowerCase() === (municipioNombre ?? '').toLowerCase()
        );
        this.empresaForm.patchValue({ municipioId: municipio?.id ?? null });
      },
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

  private ensureInternosLoaded(onLoaded?: () => void): void {
    if (this.internos().length > 0) {
      onLoaded?.();
      return;
    }

    this.proveedoresInternosService.getAll().subscribe({
      next: (data) => {
        this.internos.set(data);
        onLoaded?.();
      },
      error: () => this.internos.set([]),
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
