import { Injectable, signal } from '@angular/core';

const MOSTRAR_DESPUES_MS = 200;

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pendientes = 0;
  private mostrarTimer: ReturnType<typeof setTimeout> | null = null;

  readonly visible = signal(false);

  begin(): void {
    this.pendientes += 1;
    if (this.pendientes === 1 && this.mostrarTimer == null) {
      this.mostrarTimer = setTimeout(() => {
        this.mostrarTimer = null;
        if (this.pendientes > 0) {
          this.visible.set(true);
        }
      }, MOSTRAR_DESPUES_MS);
    }
  }

  end(): void {
    this.pendientes = Math.max(0, this.pendientes - 1);
    if (this.pendientes === 0) {
      if (this.mostrarTimer != null) {
        clearTimeout(this.mostrarTimer);
        this.mostrarTimer = null;
      }
      this.visible.set(false);
    }
  }
}
