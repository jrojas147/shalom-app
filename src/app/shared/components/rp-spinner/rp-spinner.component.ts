import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-rp-spinner',
  standalone: true,
  template: `
    @if (loading.visible()) {
      <div class="rp-spinner-overlay" role="status" aria-live="polite" aria-busy="true">
        <div class="rp-spinner">
          <span class="rp-spinner__ring" aria-hidden="true"></span>
          <span>Procesando...</span>
        </div>
      </div>
    }
  `,
  styles: `
    .rp-spinner-overlay {
      position: fixed;
      inset: 0;
      z-index: 4000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(30, 42, 46, 0.35);
    }

    .rp-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      min-width: 8.5rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      background: var(--rp-surface);
      color: var(--rp-text);
      box-shadow: var(--rp-shadow-md);
      font-family: var(--font-body);
      font-size: 0.9375rem;
    }

    .rp-spinner__ring {
      width: 2.25rem;
      height: 2.25rem;
      border: 3px solid var(--rp-primary-light);
      border-top-color: var(--rp-primary);
      border-radius: 50%;
      animation: rp-spinner-giro 0.7s linear infinite;
    }

    @keyframes rp-spinner-giro {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class RpSpinnerComponent {
  readonly loading = inject(LoadingService);
}
