import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfiguracionIvaService } from '../../../core/services/configuracion-iva.service';

@Component({
  selector: 'app-iva-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './iva-config.component.html',
  styleUrl: './iva-config.component.scss',
})
export class IvaConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly configuracionService = inject(ConfiguracionIvaService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    porcentaje: [19, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.configuracionService.get().subscribe({
      next: (data) => {
        this.form.reset({ porcentaje: Number(data.porcentaje) });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo cargar el IVA.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    this.configuracionService.update({ porcentaje: Number(this.form.controls.porcentaje.value) }).subscribe({
      next: (data) => {
        this.form.reset({ porcentaje: Number(data.porcentaje) });
        this.saving.set(false);
        this.mensaje.set('Porcentaje de IVA guardado.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el IVA.');
      },
    });
  }
}
