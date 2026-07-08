import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoDocumento } from '../../core/models/administrador-conjunto.model';
import {
  Cliente,
  ClienteRequest,
  documentoClienteLabel,
  METODOS_PAGO_CLIENTE,
  metodoPagoLabel,
  MetodoPagoPreferido,
  SexoCliente,
  SEXOS_CLIENTE,
  sexoClienteLabel,
  TIPOS_CLIENTE,
  TIPOS_DOCUMENTO,
  tipoClienteLabel,
  TipoCliente,
} from '../../core/models/cliente.model';
import { Departamento, Municipio } from '../../core/models/ubicacion.model';
import { AuthService } from '../../core/services/auth.service';
import { ClientesService } from '../../core/services/clientes.service';
import { UbicacionesService } from '../../core/services/ubicaciones.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RpModalComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientesService = inject(ClientesService);
  private readonly ubicacionesService = inject(UbicacionesService);
  private readonly auth = inject(AuthService);

  readonly tiposCliente = TIPOS_CLIENTE;
  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly sexosCliente = SEXOS_CLIENTE;
  readonly metodosPago = METODOS_PAGO_CLIENTE;
  readonly documentoClienteLabel = documentoClienteLabel;
  readonly tipoClienteLabel = tipoClienteLabel;
  readonly sexoClienteLabel = sexoClienteLabel;
  readonly metodoPagoLabel = metodoPagoLabel;

  readonly clientes = signal<Cliente[]>([]);
  readonly departamentos = signal<Departamento[]>([]);
  readonly municipios = signal<Municipio[]>([]);
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly soloLectura = signal(false);
  readonly viewingCliente = signal<Cliente | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly puedeGestionar = computed(() => this.auth.hasRole('ADMIN', 'DIRECCION'));

  readonly modalTitle = computed(() => {
    if (this.soloLectura()) {
      return 'Detalle del cliente';
    }
    return this.editingId() ? 'Editar cliente' : 'Nuevo cliente';
  });

  readonly clientesFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.clientes();
    }
    return this.clientes().filter((c) => this.matchesSearch(c, q));
  });

  readonly form = this.fb.nonNullable.group({
    tipoCliente: ['NATURAL' as TipoCliente, Validators.required],
    tipoDocumento: ['CC' as TipoDocumento, Validators.required],
    documento: ['', [Validators.required, Validators.maxLength(30)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    fechaNacimiento: [''],
    sexo: ['M' as SexoCliente],
    telefonoFijo: ['', Validators.maxLength(30)],
    telefonoCelular: ['', Validators.maxLength(30)],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    direccion: ['', Validators.maxLength(255)],
    departamentoId: [null as number | null],
    municipioId: [null as number | null],
    metodoPagoPreferido: [null as MetodoPagoPreferido | null],
    observaciones: ['', Validators.maxLength(500)],
    activo: [true],
  });

  ngOnInit(): void {
    this.form.controls.municipioId.disable();
    this.loadClientes();
    this.ubicacionesService.getDepartamentos().subscribe({
      next: (data) => this.departamentos.set(data),
      error: () => this.departamentos.set([]),
    });

    this.form.controls.tipoCliente.valueChanges.subscribe((tipo) => {
      if (tipo === 'EMPRESA') {
        this.form.patchValue({ sexo: 'NO_APLICA' });
      } else if (this.form.controls.sexo.value === 'NO_APLICA') {
        this.form.patchValue({ sexo: 'M' });
      }
    });

    this.form.controls.departamentoId.valueChanges.subscribe((departamentoId) => {
      this.loadMunicipios(departamentoId);
    });
  }

  loadClientes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.clientesService.getAll().subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.soloLectura.set(false);
    this.resetForm();
    this.showForm.set(true);
    this.error.set(null);
  }

  openView(cliente: Cliente): void {
    this.patchFormFromCliente(cliente, true);
  }

  openEdit(cliente: Cliente): void {
    this.patchFormFromCliente(cliente, false);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.soloLectura.set(false);
    this.viewingCliente.set(null);
    this.error.set(null);
    this.resetForm();
  }

  private loadMunicipios(departamentoId: number | null): void {
    this.form.patchValue({ municipioId: null }, { emitEvent: false });
    this.municipios.set([]);

    if (!departamentoId) {
      this.form.controls.municipioId.disable();
      return;
    }

    this.form.controls.municipioId.enable();
    this.ubicacionesService.getMunicipiosByDepartamento(departamentoId).subscribe({
      next: (data) => this.municipios.set(data),
      error: () => this.municipios.set([]),
    });
  }

  save(): void {
    if (this.soloLectura() || !this.puedeGestionar()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.buildRequest();
    if (!request) {
      return;
    }

    const id = this.editingId();
    this.saving.set(true);
    this.error.set(null);

    const op$ = id
      ? this.clientesService.update(id, request)
      : this.clientesService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadClientes();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  deleteCliente(cliente: Cliente): void {
    if (!this.puedeGestionar()) {
      return;
    }
    if (!confirm(`¿Eliminar el cliente "${cliente.nombre}"?`)) {
      return;
    }

    this.clientesService.delete(cliente.id).subscribe({
      next: () => {
        if (this.editingId() === cliente.id) {
          this.cancelForm();
        }
        this.loadClientes();
      },
      error: (err) => this.error.set(this.extractErrorMessage(err)),
    });
  }

  esEmpresa(): boolean {
    return this.form.controls.tipoCliente.value === 'EMPRESA';
  }

  private patchFormFromCliente(cliente: Cliente, readOnly: boolean): void {
    this.editingId.set(readOnly ? null : cliente.id);
    this.soloLectura.set(readOnly);
    this.viewingCliente.set(readOnly ? cliente : null);
    this.resetForm();
    this.form.patchValue({
      tipoCliente: cliente.tipoCliente,
      tipoDocumento: cliente.tipoDocumento,
      documento: cliente.documento,
      nombre: cliente.nombre,
      fechaNacimiento: cliente.fechaNacimiento ?? '',
      sexo: cliente.sexo ?? (cliente.tipoCliente === 'EMPRESA' ? 'NO_APLICA' : 'M'),
      telefonoFijo: cliente.telefonoFijo ?? '',
      telefonoCelular: cliente.telefonoCelular ?? '',
      email: cliente.email ?? '',
      direccion: cliente.direccion ?? '',
      metodoPagoPreferido: cliente.metodoPagoPreferido ?? null,
      observaciones: cliente.observaciones ?? '',
      activo: cliente.activo,
    });
    this.patchUbicacion(cliente.departamento, cliente.municipio);

    if (readOnly) {
      this.form.disable();
    } else {
      this.form.enable();
      if (!this.form.controls.departamentoId.value) {
        this.form.controls.municipioId.disable();
      }
    }

    this.showForm.set(true);
    this.error.set(null);
  }

  private buildRequest(): ClienteRequest | null {
    const raw = this.form.getRawValue();
    const telefonoFijo = raw.telefonoFijo.trim() || undefined;
    const telefonoCelular = raw.telefonoCelular.trim() || undefined;
    const email = raw.email.trim() || undefined;

    if (!telefonoFijo && !telefonoCelular && !email) {
      this.error.set('Indique al menos un teléfono fijo, celular o correo electrónico.');
      return null;
    }

    if (raw.tipoCliente === 'NATURAL' && !raw.sexo) {
      this.error.set('El sexo es obligatorio para clientes naturales.');
      return null;
    }

    const departamento = this.departamentos().find((d) => d.id === raw.departamentoId);
    const municipio = this.municipios().find((m) => m.id === raw.municipioId);

    return {
      tipoCliente: raw.tipoCliente,
      tipoDocumento: raw.tipoDocumento,
      documento: raw.documento.trim(),
      nombre: raw.nombre.trim(),
      fechaNacimiento: raw.fechaNacimiento || null,
      sexo: raw.tipoCliente === 'EMPRESA' ? raw.sexo ?? 'NO_APLICA' : raw.sexo,
      telefonoFijo,
      telefonoCelular,
      email,
      direccion: raw.direccion.trim() || undefined,
      departamento: departamento?.nombre,
      municipio: municipio?.nombre,
      metodoPagoPreferido: raw.metodoPagoPreferido,
      observaciones: raw.observaciones.trim() || undefined,
      activo: raw.activo,
    };
  }

  private patchUbicacion(departamentoNombre?: string | null, municipioNombre?: string | null): void {
    if (!departamentoNombre) {
      return;
    }

    const departamento = this.departamentos().find(
      (d) => d.nombre.toLowerCase() === departamentoNombre.toLowerCase()
    );
    if (!departamento) {
      return;
    }

    this.form.patchValue({ departamentoId: departamento.id }, { emitEvent: false });
    this.form.controls.municipioId.enable();
    this.ubicacionesService.getMunicipiosByDepartamento(departamento.id).subscribe({
      next: (municipios) => {
        this.municipios.set(municipios);
        const municipio = municipios.find(
          (m) => m.nombre.toLowerCase() === (municipioNombre ?? '').toLowerCase()
        );
        this.form.patchValue({ municipioId: municipio?.id ?? null }, { emitEvent: false });
      },
    });
  }

  private resetForm(): void {
    this.municipios.set([]);
    this.form.reset({
      tipoCliente: 'NATURAL',
      tipoDocumento: 'CC',
      documento: '',
      nombre: '',
      fechaNacimiento: '',
      sexo: 'M',
      telefonoFijo: '',
      telefonoCelular: '',
      email: '',
      direccion: '',
      departamentoId: null,
      municipioId: null,
      metodoPagoPreferido: null,
      observaciones: '',
      activo: true,
    });
    this.form.enable();
    this.form.controls.municipioId.disable();
  }

  private matchesSearch(cliente: Cliente, q: string): boolean {
    const fields = [
      String(cliente.id),
      cliente.nombre,
      cliente.documento,
      cliente.tipoDocumento,
      cliente.email,
      cliente.telefonoCelular,
      cliente.telefonoFijo,
      cliente.municipio,
      cliente.departamento,
      cliente.observaciones,
    ];
    return fields.some((value) => value?.toLowerCase().includes(q));
  }

  private extractErrorMessage(err: {
    error?: { message?: string; errors?: Record<string, string> };
  }): string {
    const body = err.error;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first) return first;
    }
    return body?.message ?? 'Ocurrió un error al procesar la solicitud.';
  }
}
