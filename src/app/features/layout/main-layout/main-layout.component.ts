import { UpperCasePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavIconComponent } from '../nav-icon/nav-icon.component';
import { getNavItemsForRole } from '../nav-menu.items';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UpperCasePipe, NavIconComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  readonly navItems = computed(() => {
    const user = this.auth.currentUser();
    return user ? getNavItemsForRole(user.rol) : [];
  });
  readonly today = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  logout(): void {
    this.auth.logout().subscribe();
  }
}
