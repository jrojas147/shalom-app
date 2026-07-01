import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, input, output, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CompraProveedorSeleccion,
} from '../../../core/models/compra-proveedor.model';
import { ProveedorEmpresa } from '../../../core/models/proveedor-empresa.model';
import { ProveedorExterno } from '../../../core/models/proveedor-externo.model';
import { ProveedorInterno, ProveedorInternoSucursal } from '../../../core/models/proveedor-interno.model';
import { PROVEEDOR_TABS, TipoProveedor } from '../../../core/models/proveedor.model';
import { ProveedoresEmpresasService } from '../../../core/services/proveedores-empresas.service';
import { ProveedoresExternosService } from '../../../core/services/proveedores-externos.service';
import { ProveedoresInternosService } from '../../../core/services/proveedores-internos.service';
import { RpModalComponent } from '../../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-compra-proveedor-modal',
  standalone: true,
  imports: [CommonModule, RpModalComponent],
  templateUrl: './compra-proveedor-modal.component.html',
  styleUrl: './compra-proveedor-modal.component.scss',
})
export class CompraProveedorModalComponent implements OnInit {
  private readonly internosService = inject(ProveedoresInternosService);
  private readonly externosService = inject(ProveedoresExternosService);
  private readonly empresasService = inject(ProveedoresEmpresasService);

  readonly seleccionActual = input<CompraProveedorSeleccion | null>(null);

  readonly closed = output<void>();
  readonly seleccionado = output<CompraProveedorSeleccion>();

  readonly tabs = PROVEEDOR_TABS;
  readonly tabActiva = signal<TipoProveedor>('INTERNO');
  readonly internos = signal<ProveedorInterno[]>([]);
  readonly externos = signal<ProveedorExterno[]>([]);
  readonly empresas = signal<ProveedorEmpresa[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');

  readonly internoPendiente = signal<ProveedorInterno | null>(null);
  readonly sucursalPendienteId = signal<number | null>(null);

  readonly esTabInterna = computed(() => this.tabActiva() === 'INTERNO');
  readonly esTabExterna = computed(() => this.tabActiva() === 'EXTERNO');
  readonly esTabEmpresa = computed(() => this.tabActiva() === 'EMPRESA');

  readonly sucursalesInternoPendiente = computed(() => {
    const interno = this.internoPendiente();
    if (!interno) {
      return [];
    }
    return interno.sucursalesAsociadas.filter((s) => s.activo);
  });

  readonly internosFiltrados = computed(() =>
    this.filtrarPorBusqueda(
      this.internos(),
      (p) => [p.nombre, p.documento, p.email, p.telefono]
    )
  );

  readonly externosFiltrados = computed(() =>
    this.filtrarPorBusqueda(
      this.externos(),
      (p) => [p.nombre, p.documento, p.email, p.nombreContacto]
    )
  );

  readonly empresasFiltradas = computed(() =>
    this.filtrarPorBusqueda(
      this.empresas(),
      (p) => [p.razonSocial, p.nit, p.personaContacto, p.municipio]
    )
  );

  ngOnInit(): void {
    this.restaurarSeleccionParcial();
    this.cargarProveedores();
  }

  setTab(tipo: TipoProveedor): void {
    this.tabActiva.set(tipo);
    this.busqueda.set('');
    this.error.set(null);
    this.internoPendiente.set(null);
    this.sucursalPendienteId.set(null);
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
  }

  seleccionarInterno(interno: ProveedorInterno): void {
    this.internoPendiente.set(interno);
    this.sucursalPendienteId.set(null);
    this.error.set(null);
  }

  seleccionarSucursal(sucursal: ProveedorInternoSucursal): void {
    this.sucursalPendienteId.set(sucursal.sucursalId);
  }

  confirmarInterno(): void {
    const interno = this.internoPendiente();
    const sucursalId = this.sucursalPendienteId();
    if (!interno) {
      this.error.set('Seleccione un reciclador interno.');
      return;
    }
    if (sucursalId == null) {
      this.error.set('Seleccione la sucursal asociada.');
      return;
    }

    const sucursal = interno.sucursalesAsociadas.find((s) => s.sucursalId === sucursalId);
    if (!sucursal) {
      this.error.set('La sucursal seleccionada no es válida.');
      return;
    }

    this.seleccionado.emit({
      tipo: 'INTERNO',
      proveedorId: interno.id,
      nombre: interno.nombre,
      documento: interno.documento,
      sucursalId: sucursal.sucursalId,
      sucursalNombre: sucursal.nombre,
    });
  }

  seleccionarExterno(externo: ProveedorExterno): void {
    this.seleccionado.emit({
      tipo: 'EXTERNO',
      proveedorId: externo.id,
      nombre: externo.nombre,
      documento: externo.documento,
    });
  }

  seleccionarEmpresa(empresa: ProveedorEmpresa): void {
    this.seleccionado.emit({
      tipo: 'EMPRESA',
      proveedorId: empresa.id,
      nombre: empresa.razonSocial,
      documento: empresa.nit,
    });
  }

  cerrar(): void {
    this.closed.emit();
  }

  esInternoSeleccionado(id: number): boolean {
    return this.internoPendiente()?.id === id;
  }

  esSucursalSeleccionada(sucursalId: number): boolean {
    return this.sucursalPendienteId() === sucursalId;
  }

  esSeleccionActual(seleccion: CompraProveedorSeleccion | null, tipo: TipoProveedor, id: number): boolean {
    return seleccion?.tipo === tipo && seleccion.proveedorId === id;
  }

  private cargarProveedores(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      internos: this.internosService.getAll(true).pipe(catchError(() => of([]))),
      externos: this.externosService.getAll(true).pipe(catchError(() => of([]))),
      empresas: this.empresasService.getAll(true).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ internos, externos, empresas }) => {
        this.internos.set(internos);
        this.externos.set(externos);
        this.empresas.set(empresas);
        this.restaurarInternoDesdeSeleccion(internos);
        this.loading.set(false);

        if (internos.length === 0 && externos.length === 0 && empresas.length === 0) {
          this.error.set('No hay proveedores disponibles para seleccionar.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los proveedores.');
      },
    });
  }

  private restaurarInternoDesdeSeleccion(internos: ProveedorInterno[]): void {
    const actual = this.seleccionActual();
    if (!actual || actual.tipo !== 'INTERNO') {
      return;
    }
    const interno = internos.find((item) => item.id === actual.proveedorId);
    if (interno) {
      this.internoPendiente.set(interno);
      this.sucursalPendienteId.set(actual.sucursalId ?? null);
    }
  }

  private restaurarSeleccionParcial(): void {
    const actual = this.seleccionActual();
    if (!actual) {
      return;
    }
    this.tabActiva.set(actual.tipo);
    if (actual.tipo === 'INTERNO') {
      this.sucursalPendienteId.set(actual.sucursalId ?? null);
    }
  }

  private filtrarPorBusqueda<T>(
    items: T[],
    fields: (item: T) => (string | undefined | null)[]
  ): T[] {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((item) =>
      fields(item).some((value) => value?.toLowerCase().includes(q))
    );
  }
}
