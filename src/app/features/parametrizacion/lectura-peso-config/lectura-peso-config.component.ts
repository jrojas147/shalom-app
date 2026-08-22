import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TipoLecturaPeso,
  TIPOS_LECTURA_PESO,
} from '../../../core/models/configuracion-lectura-peso.model';
import { ConfiguracionLecturaPesoService } from '../../../core/services/configuracion-lectura-peso.service';

@Component({
  selector: 'app-lectura-peso-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './lectura-peso-config.component.html',
  styleUrl: './lectura-peso-config.component.scss',
})
export class LecturaPesoConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly configuracionService = inject(ConfiguracionLecturaPesoService);

  readonly opciones = TIPOS_LECTURA_PESO;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    preCompra: this.fb.nonNullable.control<TipoLecturaPeso>('MANUAL', Validators.required),
    venta: this.fb.nonNullable.control<TipoLecturaPeso>('AMBOS', Validators.required),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.configuracionService.get().subscribe({
      next: (data) => {
        this.form.reset({
          preCompra: data.preCompra,
          venta: data.venta,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo cargar la configuración de lectura de peso.');
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

    this.configuracionService.update(this.form.getRawValue()).subscribe({
      next: (data) => {
        this.form.reset({
          preCompra: data.preCompra,
          venta: data.venta,
        });
        this.saving.set(false);
        this.mensaje.set('Configuración de lectura de peso guardada.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar la configuración de lectura de peso.');
      },
    });
  }
}
