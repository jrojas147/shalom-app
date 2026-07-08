import { Component, inject } from '@angular/core';
import { RpConfirmDialogService } from './rp-confirm-dialog.service';

@Component({
  selector: 'app-rp-confirm-dialog',
  standalone: true,
  templateUrl: './rp-confirm-dialog.component.html',
  styleUrl: './rp-confirm-dialog.component.scss',
})
export class RpConfirmDialogComponent {
  private readonly confirmDialog = inject(RpConfirmDialogService);

  readonly options = this.confirmDialog.state;

  accept(): void {
    this.confirmDialog.accept();
  }

  cancel(): void {
    this.confirmDialog.cancel();
  }

  onOverlayClick(): void {
    this.cancel();
  }
}
