import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  categoriaProductoLabel,
  Producto,
  productoImagenUrl,
  ProductoRequest,
} from '../../core/models/producto.model';
import { CategoriaProductoItem } from '../../core/models/categoria-producto.model';
import { CategoriasProductoService } from '../../core/services/categorias-producto.service';
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
  private readonly categoriasProductoService = inject(CategoriasProductoService);

  private previewObjectUrl: string | null = null;

  readonly categoriaProductoLabel = categoriaProductoLabel;
  readonly productoImagenUrl = productoImagenUrl;

  readonly categoriasProducto = signal<CategoriaProductoItem[]>([]);
  readonly imagenPreview = signal<string | null>(null);
  readonly uploadingImagen = signal(false);

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
    categoriaProducto: ['' as string],
    precioCompra: [null as number | null, Validators.min(0)],
    precioVenta: [null as number | null, Validators.min(0)],
    descripcion: ['', Validators.maxLength(500)],
    imagen: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this.loadProductos();
    this.loadCategoriasProducto();
  }

  ngOnDestroy(): void {
    this.clearImagenPreview();
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
    this.clearImagenPreview();
    this.form.patchValue({
      nombreInterno: producto.nombreInterno,
      activo: producto.activo,
      codigoCiiu: producto.codigoCiiu ?? '',
      nombreCiiu: producto.nombreCiiu ?? '',
      categoriaProducto: producto.categoriaProducto ?? '',
      precioCompra: producto.precioCompra ?? null,
      precioVenta: producto.precioVenta ?? null,
      descripcion: producto.descripcion ?? '',
      imagen: producto.imagen ?? '',
    });
    this.imagenPreview.set(productoImagenUrl(producto.imagen));
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

    this.clearImagenPreview();
    this.previewObjectUrl = URL.createObjectURL(file);
    this.imagenPreview.set(this.previewObjectUrl);
    this.uploadingImagen.set(true);
    this.error.set(null);

    this.productosService.uploadImagen(file).subscribe({
      next: (response) => {
        this.form.patchValue({ imagen: response.url });
        this.uploadingImagen.set(false);
      },
      error: (err) => {
        this.uploadingImagen.set(false);
        this.clearImagenPreview();
        this.form.patchValue({ imagen: '' });
        this.error.set(this.extractErrorMessage(err));
        input.value = '';
      },
    });
  }

  removeImagen(): void {
    this.clearImagenPreview();
    this.form.patchValue({ imagen: '' });
  }

  save(): void {
    if (this.uploadingImagen()) {
      this.error.set('Espere a que termine la carga de la imagen.');
      return;
    }

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
      categoriaProducto: raw.categoriaProducto || undefined,
      precioCompra: raw.precioCompra,
      precioVenta: raw.precioVenta,
      descripcion: raw.descripcion.trim() || undefined,
      imagen: raw.imagen.trim() || undefined,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.productosService.update(id, request)
      : this.productosService.create(request);

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

  private loadCategoriasProducto(): void {
    this.categoriasProductoService.getAll(true).subscribe({
      next: (data) => this.categoriasProducto.set(data),
      error: () => this.categoriasProducto.set([]),
    });
  }

  private matchesSearch(producto: Producto, q: string): boolean {
    const fields = [
      producto.nombreInterno,
      producto.codigoCiiu,
      producto.nombreCiiu,
      producto.categoriaProducto,
      producto.descripcion,
    ];
    return fields.some((value) => value?.toLowerCase().includes(q));
  }

  private resetForm(): void {
    this.clearImagenPreview();
    this.form.reset({
      nombreInterno: '',
      activo: true,
      codigoCiiu: '',
      nombreCiiu: '',
      categoriaProducto: '',
      precioCompra: null,
      precioVenta: null,
      descripcion: '',
      imagen: '',
    });
  }

  private clearImagenPreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.imagenPreview.set(null);
    this.uploadingImagen.set(false);
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
