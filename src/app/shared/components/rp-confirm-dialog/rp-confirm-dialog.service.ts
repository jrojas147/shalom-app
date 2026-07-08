import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  RP_CONFIRM_DEFAULTS,
  RpConfirmOptions,
  RpConfirmState,
} from './rp-confirm-dialog.model';

@Injectable({ providedIn: 'root' })
export class RpConfirmDialogService {
  private readonly _state = signal<RpConfirmState | null>(null);
  private resolve: ((value: boolean) => void) | null = null;

  readonly state = this._state.asReadonly();

  confirm(options: RpConfirmOptions): Observable<boolean> {
    if (this._state()) {
      this.close(false);
    }

    return new Observable<boolean>((subscriber) => {
      this.resolve = (value: boolean) => {
        subscriber.next(value);
        subscriber.complete();
        this.resolve = null;
      };

      this._state.set({
        ...RP_CONFIRM_DEFAULTS,
        ...options,
      });
    });
  }

  accept(): void {
    this.close(true);
  }

  cancel(): void {
    this.close(false);
  }

  private close(value: boolean): void {
    this._state.set(null);
    this.resolve?.(value);
    this.resolve = null;
  }
}
