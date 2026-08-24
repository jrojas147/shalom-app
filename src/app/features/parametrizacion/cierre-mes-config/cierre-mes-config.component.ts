import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIAS_CIERRE_MES } from '../../../core/models/configuracion-cierre-mes.model';
import { ConfiguracionCierreMesService } from '../../../core/services/configuracion-cierre-mes.service';

@Component({
  selector: 'app-cierre-mes-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cierre-mes-config.component.html',
  styleUrl: './cierre-mes-config.component.scss',
})
export class CierreMesConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly configuracionService = inject(ConfiguracionCierreMesService);

  readonly dias = DIAS_CIERRE_MES;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    diaCierre: this.fb.nonNullable.control(28, {
      validators: [Validators.required, Validators.min(1), Validators.max(28)],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.configuracionService.get().subscribe({
      next: (data) => {
        this.form.reset({ diaCierre: data.diaCierre });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo cargar el día de cierre de mes.');
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
        this.form.reset({ diaCierre: data.diaCierre });
        this.saving.set(false);
        this.mensaje.set('Día de cierre de mes guardado.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el día de cierre de mes.');
      },
    });
  }
}
