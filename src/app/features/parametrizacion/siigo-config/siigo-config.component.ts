import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  readonly accessKeyConfigured = signal(false);
  readonly documentos = signal<SiigoCatalogoItem[]>([]);
  readonly mediosPago = signal<SiigoCatalogoItem[]>([]);
  readonly vendedores = signal<SiigoCatalogoItem[]>([]);

  readonly form = this.fb.nonNullable.group({
    activo: [false],
    username: ['', [Validators.maxLength(200)]],
    accessKey: [''],
    documentTypeId: [null as number | null],
    paymentTypeId: [null as number | null],
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
        this.accessKeyConfigured.set(data.accessKeyConfigured);
        this.form.reset({
          activo: data.activo,
          username: data.username ?? '',
          accessKey: '',
          documentTypeId: data.documentTypeId ?? null,
          paymentTypeId: data.paymentTypeId ?? null,
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
    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);

    this.configuracionService
      .update({
        activo: raw.activo,
        username: raw.username.trim() || null,
        accessKey: raw.accessKey.trim() || null,
        documentTypeId: raw.documentTypeId,
        paymentTypeId: raw.paymentTypeId,
        sellerId: raw.sellerId,
      })
      .subscribe({
        next: (data) => {
          this.saving.set(false);
          this.accessKeyConfigured.set(data.accessKeyConfigured);
          this.form.patchValue({ accessKey: '' });
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
    this.configuracionService.documentos('FV').subscribe({
      next: (docs) => {
        this.documentos.set(docs ?? []);
        this.configuracionService.mediosPago().subscribe({
          next: (medios) => {
            this.mediosPago.set(medios ?? []);
            this.configuracionService.vendedores().subscribe({
              next: (vendedores) => {
                this.vendedores.set(vendedores ?? []);
                this.loadingCatalogos.set(false);
              },
              error: () => {
                this.vendedores.set([]);
                this.loadingCatalogos.set(false);
              },
            });
          },
          error: () => {
            this.mediosPago.set([]);
            this.loadingCatalogos.set(false);
          },
        });
      },
      error: () => {
        this.documentos.set([]);
        this.loadingCatalogos.set(false);
      },
    });
  }
}
