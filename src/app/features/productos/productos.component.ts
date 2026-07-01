import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Producto,
  productoImagenUrl,
  ProductoRequest,
} from '../../core/models/producto.model';
import { ProductosService } from '../../core/services/productos.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
const IMAGEN_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RpModalComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss',
})
export class ProductosComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productosService = inject(ProductosService);

  private previewObjectUrl: string | null = null;

  readonly productoImagenUrl = productoImagenUrl;

  readonly imagenPendiente = signal<File | null>(null);
  readonly imagenGuardada = signal<string | null>(null);
  readonly imagenEliminada = signal(false);

  readonly imagenPreview = computed(() => {
    if (this.previewObjectUrl) {
      return this.previewObjectUrl;
    }
    if (this.imagenEliminada()) {
      return null;
    }
    return productoImagenUrl(this.imagenGuardada());
  });

  readonly tieneImagen = computed(
    () => !!this.imagenPendiente() || (!this.imagenEliminada() && !!this.imagenGuardada())
  );

  readonly productos = signal<Producto[]>([]);
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly modalTitle = computed(() =>
    this.editingId() ? 'Editar producto' : 'Nuevo producto'
  );

  readonly productosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return this.productos();
    }
    return this.productos().filter((p) => this.matchesSearch(p, q));
  });

  readonly form = this.fb.nonNullable.group({
    nombreInterno: ['', [Validators.required, Validators.maxLength(100)]],
    activo: [true],
    codigoCiiu: ['', Validators.maxLength(20)],
    nombreCiiu: ['', Validators.maxLength(200)],
    precioCompra: [null as number | null, Validators.min(0)],
    precioVenta: [null as number | null, Validators.min(0)],
    descripcion: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this.loadProductos();
  }

  ngOnDestroy(): void {
    this.revokePreviewObjectUrl();
  }

  onBusquedaChange(value: string): void {
    this.busqueda.set(value);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.resetForm();
    this.showForm.set(true);
    this.error.set(null);
  }

  openEdit(producto: Producto): void {
    this.editingId.set(producto.id);
    this.resetImagenState();
    this.form.patchValue({
      nombreInterno: producto.nombreInterno,
      activo: producto.activo,
      codigoCiiu: producto.codigoCiiu ?? '',
      nombreCiiu: producto.nombreCiiu ?? '',
      precioCompra: producto.precioCompra ?? null,
      precioVenta: producto.precioVenta ?? null,
      descripcion: producto.descripcion ?? '',
    });
    this.imagenGuardada.set(producto.imagen ?? null);
    this.showForm.set(true);
    this.error.set(null);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.error.set(null);
    this.resetForm();
  }

  onImagenSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!IMAGEN_TIPOS_PERMITIDOS.includes(file.type)) {
      this.error.set('Formato no permitido. Use JPG, PNG, WEBP o GIF.');
      input.value = '';
      return;
    }

    if (file.size > MAX_IMAGEN_BYTES) {
      this.error.set('La imagen no puede superar 5 MB.');
      input.value = '';
      return;
    }

    this.revokePreviewObjectUrl();
    this.previewObjectUrl = URL.createObjectURL(file);
    this.imagenPendiente.set(file);
    this.imagenEliminada.set(false);
    this.error.set(null);
  }

  removeImagen(): void {
    this.revokePreviewObjectUrl();
    this.imagenPendiente.set(null);
    this.imagenEliminada.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: ProductoRequest = {
      nombreInterno: raw.nombreInterno.trim(),
      activo: raw.activo,
      codigoCiiu: raw.codigoCiiu.trim() || undefined,
      nombreCiiu: raw.nombreCiiu.trim() || undefined,
      precioCompra: raw.precioCompra,
      precioVenta: raw.precioVenta,
      descripcion: raw.descripcion.trim() || undefined,
    };

    const id = this.editingId();
    if (id && this.imagenEliminada()) {
      request.eliminarImagen = true;
    }

    this.saving.set(true);
    this.error.set(null);

    const imagen = this.imagenPendiente();
    const op$ = id
      ? this.productosService.update(id, request, imagen)
      : this.productosService.create(request, imagen);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadProductos();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  deleteProducto(producto: Producto): void {
    if (!confirm(`¿Eliminar el producto "${producto.nombreInterno}"?`)) {
      return;
    }

    this.productosService.delete(producto.id).subscribe({
      next: () => {
        if (this.editingId() === producto.id) {
          this.cancelForm();
        }
        this.loadProductos();
      },
      error: (err) => this.error.set(this.extractErrorMessage(err)),
    });
  }

  formatPrecio(value?: number | null): string {
    if (value == null) {
      return '—';
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private loadProductos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productosService.getAll().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(err));
      },
    });
  }

  private matchesSearch(producto: Producto, q: string): boolean {
    const fields = [
      producto.nombreInterno,
      producto.codigoCiiu,
      producto.nombreCiiu,
      producto.descripcion,
    ];
    return fields.some((value) => value?.toLowerCase().includes(q));
  }

  private resetForm(): void {
    this.resetImagenState();
    this.form.reset({
      nombreInterno: '',
      activo: true,
      codigoCiiu: '',
      nombreCiiu: '',
      precioCompra: null,
      precioVenta: null,
      descripcion: '',
    });
  }

  private resetImagenState(): void {
    this.revokePreviewObjectUrl();
    this.imagenPendiente.set(null);
    this.imagenGuardada.set(null);
    this.imagenEliminada.set(false);
  }

  private revokePreviewObjectUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
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
