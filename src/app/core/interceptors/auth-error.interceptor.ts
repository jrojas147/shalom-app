import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint =
        req.url.includes('/api/auth/login') ||
        req.url.includes('/api/auth/refresh') ||
        req.url.includes('/api/auth/logout');

      const requestToken = req.headers.get('Authorization');
      const currentToken = auth.getToken();
      const usedCurrentSession =
        !!currentToken && requestToken === `Bearer ${currentToken}`;

      if (
        error.status === 401 &&
        !isAuthEndpoint &&
        usedCurrentSession &&
        auth.isLoggedIn()
      ) {
        auth.forceLogout();
      }

      return throwError(() => error);
    })
  );
};
