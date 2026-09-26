import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { SiigoCatalogoItem } from '../../../core/models/configuracion-siigo.model';
import { ConfiguracionSiigoService } from '../../../core/services/configuracion-siigo.service';

@Component({
  selector: 'app-siigo-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './siigo-config.component.html',
  styleUrl: './siigo-config.component.scss',
})
export class SiigoConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly configuracionService = inject(ConfiguracionSiigoService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly loadingCatalogos = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly partnerId = signal('ShalomApp');
  readonly username = signal<string | null>(null);
  readonly credentialsConfigured = signal(false);
  readonly documentos = signal<SiigoCatalogoItem[]>([]);
  readonly mediosPago = signal<SiigoCatalogoItem[]>([]);
  readonly documentosDs = signal<SiigoCatalogoItem[]>([]);
  readonly mediosPagoDs = signal<SiigoCatalogoItem[]>([]);
  readonly vendedores = signal<SiigoCatalogoItem[]>([]);

  readonly form = this.fb.nonNullable.group({
    activo: [false],
    documentTypeId: [null as number | null],
    paymentTypeId: [null as number | null],
    documentTypeDsId: [null as number | null],
    paymentTypeDsId: [null as number | null],
    sellerId: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.configuracionService.get().subscribe({
      next: (data) => {
        this.partnerId.set(data.partnerId || 'ShalomApp');
        this.username.set(data.username ?? null);
        this.credentialsConfigured.set(data.accessKeyConfigured);
        this.form.reset({
          activo: data.activo,
          documentTypeId: data.documentTypeId ?? null,
          paymentTypeId: data.paymentTypeId ?? null,
          documentTypeDsId: data.documentTypeDsId ?? null,
          paymentTypeDsId: data.paymentTypeDsId ?? null,
          sellerId: data.sellerId ?? null,
        });
        this.loading.set(false);
        if (data.accessKeyConfigured) {
          this.cargarCatalogos();
        }
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo cargar la configuración de Siigo.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.activo && !this.credentialsConfigured()) {
      this.error.set(
        'No se puede activar Siigo: defina SIIGO_USERNAME y SIIGO_ACCESS_KEY en el .env del servidor.'
      );
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);

    this.configuracionService
      .update({
        activo: raw.activo,
        documentTypeId: raw.documentTypeId,
        paymentTypeId: raw.paymentTypeId,
        documentTypeDsId: raw.documentTypeDsId,
        paymentTypeDsId: raw.paymentTypeDsId,
        sellerId: raw.sellerId,
      })
      .subscribe({
        next: (data) => {
          this.saving.set(false);
          this.credentialsConfigured.set(data.accessKeyConfigured);
          this.username.set(data.username ?? null);
          this.form.markAsPristine();
          this.mensaje.set('Configuración de Siigo guardada.');
          if (data.accessKeyConfigured) {
            this.cargarCatalogos();
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message ?? 'No se pudo guardar la configuración de Siigo.');
        },
      });
  }

  probar(): void {
    this.testing.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    this.configuracionService.probar().subscribe({
      next: (data) => {
        this.testing.set(false);
        this.mensaje.set(data.mensaje);
        this.cargarCatalogos();
      },
      error: (err) => {
        this.testing.set(false);
        this.error.set(err.error?.message ?? 'No se pudo probar la conexión con Siigo.');
      },
    });
  }

  private cargarCatalogos(): void {
    this.loadingCatalogos.set(true);
    const empty = of([] as SiigoCatalogoItem[]);
    forkJoin({
      documentos: this.configuracionService.documentos('RP').pipe(
        catchError(() => this.configuracionService.documentos('CE').pipe(catchError(() => empty)))
      ),
      mediosPago: this.configuracionService.mediosPago('RP').pipe(
        catchError(() => this.configuracionService.mediosPago('CE').pipe(
          catchError(() => this.configuracionService.mediosPago('FV').pipe(catchError(() => empty)))
        ))
      ),
      documentosDs: this.configuracionService.documentos('DS').pipe(catchError(() => empty)),
      mediosPagoDs: this.configuracionService.mediosPago('DS').pipe(catchError(() => empty)),
      vendedores: this.configuracionService.vendedores().pipe(catchError(() => empty)),
    }).subscribe({
      next: (data) => {
        this.documentos.set(data.documentos ?? []);
        this.mediosPago.set(data.mediosPago ?? []);
        this.documentosDs.set(data.documentosDs ?? []);
        this.mediosPagoDs.set(data.mediosPagoDs ?? []);
        this.vendedores.set(data.vendedores ?? []);
        this.aplicarCreditoPorDefecto(data.mediosPagoDs ?? []);
        this.loadingCatalogos.set(false);
      },
      error: () => {
        this.loadingCatalogos.set(false);
      },
    });
  }

  private aplicarCreditoPorDefecto(medios: SiigoCatalogoItem[]): void {
    const credito = medios.find((item) => this.esCredito(item.nombre));
    if (!credito) {
      return;
    }
    const actual = this.form.controls.paymentTypeDsId.value;
    const vigente = medios.some((item) => item.id === actual && this.esCredito(item.nombre));
    if (!vigente) {
      this.form.controls.paymentTypeDsId.setValue(credito.id);
    }
  }

  private esCredito(nombre: string | null | undefined): boolean {
    const n = (nombre ?? '')
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .trim()
      .toLowerCase();
    return n === 'credito' || n.startsWith('credito ');
  }
}
