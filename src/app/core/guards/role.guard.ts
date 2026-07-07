import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getDefaultAppRoute } from '../config/role-access';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

export const roleGuard = (roles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }

    if (auth.hasRole(...roles)) {
      return true;
    }

    const user = auth.currentUser();
    return router.createUrlTree([getDefaultAppRoute(user?.rol ?? 'ADMIN')]);
  };
};
