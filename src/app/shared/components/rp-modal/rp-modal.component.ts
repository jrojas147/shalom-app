import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-rp-modal',
  standalone: true,
  host: {
    '[style.z-index]': 'stacked() ? 1100 : 1000',
    '[style.position]': '"relative"',
    '[style.display]': '"block"',
  },
  template: `
    <div
      class="rp-modal-overlay"
      [class.rp-modal-overlay--stacked]="stacked()"
      (click)="onOverlayClick()"
    >
      <div
        class="rp-modal-panel"
        [class.rp-modal-panel--wide]="wide()"
        [class.rp-modal-panel--wide-compact]="wide() && compact()"
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
  compact = input(false);
  stacked = input(false);
  closeOnOverlay = input(false);

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
