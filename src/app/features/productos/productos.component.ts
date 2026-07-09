import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Producto,
  productoImagenUrl,
  ProductoRequest,
} from '../../core/models/producto.model';
import { CodigoCiiu } from '../../core/models/codigo-ciiu.model';
import { CodigosCiiuService } from '../../core/services/codigos-ciiu.service';
import { ProductosService } from '../../core/services/productos.service';
import {
  formatCurrencyCo,
  parseCurrencyCo,
  resolveCurrencyCoCursor,
} from '../../core/utils/currency.util';
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
  @ViewChild('imagenArchivoInput')
  private imagenArchivoInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly productosService = inject(ProductosService);
  private readonly codigosCiiuService = inject(CodigosCiiuService);

  private previewObjectUrl: string | null = null;

  readonly productoImagenUrl = productoImagenUrl;

  readonly codigosCiiu = signal<CodigoCiiu[]>([]);

  readonly imagenPendiente = signal<File | null>(null);
  readonly imagenGuardada = signal<string | null>(null);
  readonly imagenEliminada = signal(false);
  readonly imagenDragOver = signal(false);

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

  readonly imagenEtiqueta = computed(() => {
    const pendiente = this.imagenPendiente();
    if (pendiente) {
      return pendiente.name;
    }
    return 'Imagen actual del producto';
  });

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

  readonly precioCompraDisplay = signal('');
  readonly precioVentaDisplay = signal('');

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
    codigoCiiuId: [null as number | null],
    precioCompra: [null as number | null, Validators.min(0)],
    precioVenta: [null as number | null, Validators.min(0)],
    descripcion: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this.loadProductos();
    this.loadCodigosCiiu();
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
      codigoCiiuId: producto.codigoCiiuId ?? null,
      precioCompra: producto.precioCompra ?? null,
      precioVenta: producto.precioVenta ?? null,
      descripcion: producto.descripcion ?? '',
    });
    this.imagenGuardada.set(producto.imagen ?? null);
    this.syncPrecioDisplays();
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

    this.processImagenFile(file, input);
  }

  onImagenDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.saving()) {
      return;
    }
    this.imagenDragOver.set(true);
  }

  onImagenDragLeave(event: DragEvent): void {
    event.preventDefault();
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    this.imagenDragOver.set(false);
  }

  onImagenDrop(event: DragEvent): void {
    event.preventDefault();
    this.imagenDragOver.set(false);

    if (this.saving()) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    this.processImagenFile(file, this.imagenArchivoInput?.nativeElement);
  }

  removeImagen(): void {
    this.revokePreviewObjectUrl();
    this.imagenPendiente.set(null);
    this.imagenEliminada.set(true);
    this.resetImagenInput();
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
      codigoCiiuId: raw.codigoCiiuId ?? undefined,
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
    return formatCurrencyCo(value);
  }

  onPrecioInput(campo: 'precioCompra' | 'precioVenta', event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectionStart = input.selectionStart ?? input.value.length;
    const digitsBefore = input.value.slice(0, selectionStart).replace(/\D/g, '').length;

    const parsed = parseCurrencyCo(input.value);
    const formatted = formatCurrencyCo(parsed);

    this.form.controls[campo].setValue(parsed);
    this.setPrecioDisplay(campo, formatted);

    const cursor = resolveCurrencyCoCursor(formatted, digitsBefore);
    requestAnimationFrame(() => input.setSelectionRange(cursor, cursor));
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

  private loadCodigosCiiu(): void {
    this.codigosCiiuService.getAll().subscribe({
      next: (data) => this.codigosCiiu.set(data),
      error: () => this.codigosCiiu.set([]),
    });
  }

  private matchesSearch(producto: Producto, q: string): boolean {
    const fields = [
      String(producto.id),
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
      codigoCiiuId: null,
      precioCompra: null,
      precioVenta: null,
      descripcion: '',
    });
    this.syncPrecioDisplays();
  }

  private syncPrecioDisplays(): void {
    this.setPrecioDisplay('precioCompra', formatCurrencyCo(this.form.controls.precioCompra.value));
    this.setPrecioDisplay('precioVenta', formatCurrencyCo(this.form.controls.precioVenta.value));
  }

  private setPrecioDisplay(campo: 'precioCompra' | 'precioVenta', value: string): void {
    if (campo === 'precioCompra') {
      this.precioCompraDisplay.set(value);
      return;
    }
    this.precioVentaDisplay.set(value);
  }

  private resetImagenState(): void {
    this.revokePreviewObjectUrl();
    this.imagenPendiente.set(null);
    this.imagenGuardada.set(null);
    this.imagenEliminada.set(false);
    this.imagenDragOver.set(false);
    this.resetImagenInput();
  }

  private processImagenFile(file: File, input?: HTMLInputElement): void {
    if (!IMAGEN_TIPOS_PERMITIDOS.includes(file.type)) {
      this.error.set('Formato no permitido. Use JPG, PNG, WEBP o GIF.');
      if (input) {
        input.value = '';
      }
      return;
    }

    if (file.size > MAX_IMAGEN_BYTES) {
      this.error.set('La imagen no puede superar 5 MB.');
      if (input) {
        input.value = '';
      }
      return;
    }

    this.revokePreviewObjectUrl();
    this.previewObjectUrl = URL.createObjectURL(file);
    this.imagenPendiente.set(file);
    this.imagenEliminada.set(false);
    this.error.set(null);
  }

  private resetImagenInput(): void {
    const input = this.imagenArchivoInput?.nativeElement;
    if (input) {
      input.value = '';
    }
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
