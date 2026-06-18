import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-rp-modal',
  standalone: true,
  template: `
    <div class="rp-modal-overlay" (click)="onOverlayClick()">
      <div
        class="rp-modal-panel"
        [class.rp-modal-panel--wide]="wide()"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <header class="rp-modal-header">
          <h2>{{ title() }}</h2>
          <button type="button" class="rp-modal-close" (click)="close()" aria-label="Cerrar">
            ×
          </button>
        </header>
        <div class="rp-modal-body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styleUrl: './rp-modal.component.scss',
})
export class RpModalComponent {
  title = input.required<string>();
  wide = input(false);
  closeOnOverlay = input(true);

  closed = output<void>();

  close(): void {
    this.closed.emit();
  }

  onOverlayClick(): void {
    if (this.closeOnOverlay()) {
      this.close();
    }
  }
}
