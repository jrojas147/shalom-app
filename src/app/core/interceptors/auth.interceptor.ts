import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const user = auth.currentUser();

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (user) {
    headers = headers.set('X-User-Id', String(user.id));
    if (user.comercioId != null) {
      headers = headers.set('X-Comercio-Id', String(user.comercioId));
    }
  }

  return next(req.clone({ headers }));
};
