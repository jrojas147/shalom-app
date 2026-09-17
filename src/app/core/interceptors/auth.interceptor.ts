import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const AUTH_PUBLIC_URLS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/close-session',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const isAuthPublic = AUTH_PUBLIC_URLS.some((url) => req.url.includes(url));

  if (!token || isAuthPublic) {
    return next(req);
  }

  const user = auth.currentUser();
  let headers = req.headers.set('Authorization', `Bearer ${token}`);

  if (user) {
    const comercioId = auth.getEffectiveComercioId();
    if (comercioId != null) {
      headers = headers.set('X-Comercio-Id', String(comercioId));
    }
  }

  return next(req.clone({ headers }));
};
