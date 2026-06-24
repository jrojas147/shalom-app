import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CATEGORIAS_PRODUCTO,
  categoriaProductoLabel,
  Producto,
  ProductoRequest,
} from '../../core/models/producto.model';
import { ProductosService } from '../../core/services/productos.service';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RpModalComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss',
})
export class ProductosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productosService = inject(ProductosService);

  readonly categorias = CATEGORIAS_PRODUCTO;
  readonly categoriaProductoLabel = categoriaProductoLabel;

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
    this.showForm.set(true);
    this.error.set(null);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.error.set(null);
    this.resetForm();
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
