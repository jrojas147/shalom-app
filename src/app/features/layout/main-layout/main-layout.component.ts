import { UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RpConfirmDialogComponent } from '../../../shared/components/rp-confirm-dialog/rp-confirm-dialog.component';
import { NavIconComponent } from '../nav-icon/nav-icon.component';
import { NavMenuItem, getNavItemsForRole } from '../nav-menu.items';

const NAV_COMPACT_QUERY = '(max-width: 768px)';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    UpperCasePipe,
    NavIconComponent,
    RpConfirmDialogComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly navItems = computed(() => getNavItemsForRole(this.auth.currentUser()?.rol));
  readonly compactNav = signal(false);
  readonly revealedRoute = signal<string | null>(null);
  readonly revealedLabel = signal<{ text: string; top: number; left: number } | null>(null);
  readonly today = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  private revealTimer: ReturnType<typeof setTimeout> | null = null;
  private skipDocumentClick = false;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    const mq = window.matchMedia(NAV_COMPACT_QUERY);
    const apply = () => {
      this.compactNav.set(mq.matches);
      if (!mq.matches) {
        this.ocultarEtiqueta();
      }
    };
    apply();
    mq.addEventListener('change', apply);
    this.destroyRef.onDestroy(() => {
      mq.removeEventListener('change', apply);
      this.clearRevealTimer();
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.skipDocumentClick) {
      this.skipDocumentClick = false;
      return;
    }
    if (this.revealedRoute()) {
      this.ocultarEtiqueta();
    }
  }

  onNavClick(event: MouseEvent, item: NavMenuItem): void {
    if (!this.compactNav()) {
      return;
    }
    if (this.revealedRoute() === item.route) {
      this.ocultarEtiqueta();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.skipDocumentClick = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.revealedRoute.set(item.route);
    this.revealedLabel.set({
      text: item.label,
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
    this.clearRevealTimer();
    this.revealTimer = setTimeout(() => this.ocultarEtiqueta(), 3000);
  }

  onNavScroll(): void {
    if (this.revealedRoute()) {
      this.ocultarEtiqueta();
    }
  }

  logout(): void {
    this.auth.logout().subscribe();
  }

  private ocultarEtiqueta(): void {
    this.clearRevealTimer();
    this.revealedRoute.set(null);
    this.revealedLabel.set(null);
  }

  private clearRevealTimer(): void {
    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }
  }
}
