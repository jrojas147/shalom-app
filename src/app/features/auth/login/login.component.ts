import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { getDefaultAppRoute } from '../../../core/config/role-access';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sessionConflict = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(cerrarSesionPrevia = false): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.sessionConflict.set(false);

    const { username, password } = this.form.getRawValue();

    if (cerrarSesionPrevia) {
      this.auth.closeActiveSession(username, password).subscribe({
        next: () => this.login(username, password, false),
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
      return;
    }

    this.login(username, password, false);
  }

  private login(username: string, password: string, cerrarSesionPrevia: boolean): void {
    this.auth.login({ username, password, cerrarSesionPrevia }).subscribe({
      next: () => {
        this.loading.set(false);
        const user = this.auth.currentUser();
        void this.router.navigateByUrl(getDefaultAppRoute(user?.rol));
      },
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  private handleError(err: HttpErrorResponse): void {
    this.loading.set(false);
    if (err.status === 409) {
      this.sessionConflict.set(true);
      this.error.set('Ya existe una sesión activa para este usuario.');
    } else if (err.status === 423) {
      this.error.set('La cuenta está inactiva.');
    } else if (err.status === 401) {
      this.error.set('Credenciales inválidas.');
    } else {
      this.error.set('No se pudo iniciar sesión. Intente nuevamente.');
    }
  }
}
