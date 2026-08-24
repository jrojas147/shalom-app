import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../core/models/cliente.model';
import {
  EmpaqueBodega,
  EmpaqueContraparteTipo,
  EmpaqueMovimiento,
  EmpaqueOperacion,
  EmpaqueResumen,
  EmpaqueSaldo,
  empaqueContraparteTipoLabel,
  empaqueOperacionLabel,
  empaqueReferenciaLabel,
} from '../../core/models/empaque.model';
import { ProveedorInterno } from '../../core/models/proveedor-interno.model';
import { TipoEmpaque } from '../../core/models/tipo-empaque.model';
import { AuthService } from '../../core/services/auth.service';
import { ClientesService } from '../../core/services/clientes.service';
import { EmpaquesService } from '../../core/services/empaques.service';
import { ProveedoresInternosService } from '../../core/services/proveedores-internos.service';
import { TiposEmpaqueService } from '../../core/services/tipos-empaque.service';
import { RpConfirmDialogService } from '../../shared/components/rp-confirm-dialog/rp-confirm-dialog.service';

type EmpaqueVista = 'bodega' | 'proveedores' | 'clientes' | 'movimientos';

@Component({
  selector: 'app-empaques',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './empaques.component.html',
  styleUrl: './empaques.component.scss',
})
export class EmpaquesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly empaquesService = inject(EmpaquesService);
  private readonly tiposEmpaqueService = inject(TiposEmpaqueService);
  private readonly proveedoresService = inject(ProveedoresInternosService);
  private readonly clientesService = inject(ClientesService);
  private readonly auth = inject(AuthService);
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly vista = signal<EmpaqueVista>('bodega');
  readonly tiposEmpaque = signal<TipoEmpaque[]>([]);
  readonly proveedores = signal<ProveedorInterno[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly bodega = signal<EmpaqueBodega[]>([]);
  readonly saldos = signal<EmpaqueSaldo[]>([]);
  readonly movimientos = signal<EmpaqueMovimiento[]>([]);
  readonly resumen = signal<EmpaqueResumen | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly busqueda = signal('');

  readonly puedeAnular = computed(() => this.auth.hasRole('ADMIN', 'DIRECCION'));

  readonly form = this.fb.nonNullable.group({
    operacion: ['INGRESO' as EmpaqueOperacion, Validators.required],
    contraparteId: [null as number | null],
    tipoEmpaqueId: [null as number | null, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    observacion: ['', Validators.maxLength(500)],
  });

  readonly bodegaFiltrada = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.bodega();
    }
    return this.bodega().filter((item) => item.tipoEmpaqueNombre.toLowerCase().includes(q));
  });

  readonly saldosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const tipo = this.contraparteTipoVista();
    const list = tipo
      ? this.saldos().filter((saldo) => saldo.contraparteTipo === tipo)
      : this.saldos();
    if (!q) {
      return list;
    }
    return list.filter((saldo) => {
      const haystack = [saldo.contraparteNombre, saldo.tipoEmpaqueNombre].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  });

  readonly movimientosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.movimientos();
    }
    return this.movimientos().filter((mov) => {
      const haystack = [
        mov.contraparteNombre,
        mov.tipoEmpaqueNombre,
        empaqueOperacionLabel(mov.operacion),
        empaqueReferenciaLabel(mov.referenciaTipo),
        mov.observacion,
        mov.usuarioRegistroNombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  readonly contrapartesForm = computed(() => {
    if (this.vista() === 'clientes') {
      return this.clientes()
        .filter((cliente) => cliente.activo !== false)
        .map((cliente) => ({ id: cliente.id, nombre: cliente.nombre }));
    }
    return this.proveedores()
      .filter((proveedor) => proveedor.activo !== false)
      .map((proveedor) => ({ id: proveedor.id, nombre: proveedor.nombre }));
  });

  ngOnInit(): void {
    this.loadAll();
  }

  setVista(vista: EmpaqueVista): void {
    this.vista.set(vista);
    this.busqueda.set('');
    this.form.controls.contraparteId.setValue(null);
    if (vista === 'clientes') {
      this.form.controls.operacion.setValue('RECIBIR');
      this.form.controls.contraparteId.setValidators(Validators.required);
    } else if (vista === 'proveedores') {
      this.form.controls.operacion.setValue('ENTREGAR');
      this.form.controls.contraparteId.setValidators(Validators.required);
    } else {
      this.form.controls.operacion.setValue('INGRESO');
      this.form.controls.contraparteId.clearValidators();
    }
    this.form.controls.contraparteId.updateValueAndValidity();
    this.error.set(null);
    this.mensaje.set(null);
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      tipos: this.tiposEmpaqueService.getAll(true),
      proveedores: this.proveedoresService.getAll(true),
      clientes: this.clientesService.getAll(true),
      resumen: this.empaquesService.resumen(),
      bodega: this.empaquesService.bodega(),
      saldos: this.empaquesService.saldos(),
      movimientos: this.empaquesService.movimientos(),
    }).subscribe({
      next: ({ tipos, proveedores, clientes, resumen, bodega, saldos, movimientos }) => {
        this.tiposEmpaque.set((tipos ?? []).filter((tipo) => tipo.activo !== false));
        this.proveedores.set(proveedores ?? []);
        this.clientes.set(clientes ?? []);
        this.resumen.set(resumen);
        this.bodega.set(bodega ?? []);
        this.saldos.set(saldos ?? []);
        this.movimientos.set(movimientos ?? []);
        const tipoId = this.form.controls.tipoEmpaqueId.value;
        if (!tipoId && this.tiposEmpaque().length) {
          this.form.controls.tipoEmpaqueId.setValue(this.tiposEmpaque()[0].id);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'No se pudo cargar el control de empaques.');
      },
    });
  }

  registrar(): void {
    if (this.form.invalid || this.vista() === 'movimientos') {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const tipoEmpaqueId = raw.tipoEmpaqueId;
    if (tipoEmpaqueId == null) {
      return;
    }

    const tipoNombre =
      this.tiposEmpaque().find((tipo) => tipo.id === tipoEmpaqueId)?.nombre ?? 'empaque';

    if (this.vista() === 'bodega') {
      const operacion = raw.operacion === 'BAJA' ? 'BAJA' : 'INGRESO';
      this.confirmarYRegistrar(
        `${empaqueOperacionLabel(operacion)} en bodega`,
        `¿Confirma ${empaqueOperacionLabel(operacion).toLowerCase()} de ${raw.cantidad} ${tipoNombre} en bodega?`,
        empaqueOperacionLabel(operacion),
        () =>
          this.empaquesService.registrarBodega({
            tipoEmpaqueId,
            cantidad: raw.cantidad,
            operacion,
            observacion: raw.observacion.trim() || undefined,
          })
      );
      return;
    }

    const contraparteTipo = this.contraparteTipoVista();
    const contraparteId = raw.contraparteId;
    if (!contraparteTipo || contraparteId == null) {
      return;
    }
    const operacion: 'ENTREGAR' | 'RECIBIR' =
      raw.operacion === 'ENTREGAR' ? 'ENTREGAR' : 'RECIBIR';
    const contraparteNombre =
      this.contrapartesForm().find((item) => item.id === contraparteId)?.nombre ?? 'contraparte';
    const preposicion = operacion === 'ENTREGAR' ? 'a' : 'de';
    this.confirmarYRegistrar(
      `${empaqueOperacionLabel(operacion)} empaques`,
      `¿Confirma ${empaqueOperacionLabel(operacion).toLowerCase()} ${raw.cantidad} ${tipoNombre} ${preposicion} ${contraparteNombre}?`,
      empaqueOperacionLabel(operacion),
      () =>
        this.empaquesService.registrar({
          contraparteTipo,
          contraparteId,
          tipoEmpaqueId,
          cantidad: raw.cantidad,
          operacion,
          observacion: raw.observacion.trim() || undefined,
        })
    );
  }

  anular(movimiento: EmpaqueMovimiento): void {
    if (!this.puedeAnular() || !this.esAnulable(movimiento)) {
      return;
    }
    this.confirmDialog
      .confirm({
        title: 'Anular movimiento',
        message: `¿Anular la ${empaqueOperacionLabel(movimiento.operacion).toLowerCase()} de ${
          movimiento.cantidad
        } ${movimiento.tipoEmpaqueNombre}? El saldo se revertirá.`,
        confirmLabel: 'Anular',
        confirmVariant: 'danger',
      })
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.empaquesService.anular(movimiento.id).subscribe({
          next: () => {
            this.mensaje.set('Movimiento anulado.');
            this.loadAll();
          },
          error: (err) => {
            this.error.set(err.error?.message ?? 'No se pudo anular el movimiento.');
          },
        });
      });
  }

  esAnulable(movimiento: EmpaqueMovimiento): boolean {
    return movimiento.referenciaTipo === 'MANUAL' || movimiento.referenciaTipo === 'BODEGA';
  }

  operacionLabel(operacion: EmpaqueOperacion): string {
    return empaqueOperacionLabel(operacion);
  }

  referenciaLabel(tipo: EmpaqueMovimiento['referenciaTipo']): string {
    return empaqueReferenciaLabel(tipo);
  }

  contraparteTipoLabel(tipo?: EmpaqueContraparteTipo | null): string {
    return empaqueContraparteTipoLabel(tipo);
  }

  formatDelta(value: number): string {
    if (value > 0) {
      return `+${value}`;
    }
    return String(value);
  }

  private confirmarYRegistrar(
    title: string,
    message: string,
    confirmLabel: string,
    request: () => ReturnType<EmpaquesService['registrar']>
  ): void {
    this.confirmDialog
      .confirm({ title, message, confirmLabel })
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.saving.set(true);
        this.error.set(null);
        this.mensaje.set(null);
        request().subscribe({
          next: () => {
            this.saving.set(false);
            this.mensaje.set('Movimiento de empaque registrado.');
            this.form.patchValue({ cantidad: 1, observacion: '' });
            this.loadAll();
          },
          error: (err) => {
            this.saving.set(false);
            this.error.set(err.error?.message ?? 'No se pudo registrar el movimiento.');
          },
        });
      });
  }

  private contraparteTipoVista(): EmpaqueContraparteTipo | null {
    if (this.vista() === 'proveedores') {
      return 'PROVEEDOR_INTERNO';
    }
    if (this.vista() === 'clientes') {
      return 'CLIENTE';
    }
    return null;
  }
}
