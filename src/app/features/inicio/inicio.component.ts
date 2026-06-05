import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';
import { HealthResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
})
export class InicioComponent {
  private readonly healthService = inject(HealthService);
  readonly auth = inject(AuthService);

  readonly health = signal<HealthResponse | null>(null);
  readonly healthError = signal<string | null>(null);
  readonly loading = signal(false);

  checkHealth(): void {
    this.loading.set(true);
    this.healthError.set(null);

    this.healthService.check().subscribe({
      next: (response) => {
        this.health.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.healthError.set('No se pudo validar el token en shalom-core.');
        this.loading.set(false);
      },
    });
  }
}
