import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { RolesService } from '../../core/services/roles.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { Rol, User, UsuarioRequest } from '../../core/models/user.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);
  private readonly rolesService = inject(RolesService);
  readonly auth = inject(AuthService);

  readonly users = signal<User[]>([]);
  readonly roles = signal<Rol[]>([]);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly usernameAvailable = signal<boolean | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    nombre: [''],
    apellido: [''],
    rolId: [0, Validators.required],
    comercioId: [null as number | null],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadRoles();
    this.loadPage(0);

    this.form.controls.username.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((username) =>
          this.usuariosService.checkUsername(username, this.editingId() ?? undefined)
        )
      )
      .subscribe({
        next: (result) => this.usernameAvailable.set(result.available),
        error: () => this.usernameAvailable.set(null),
      });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.usuariosService.getPage(page).subscribe({
      next: (data) => {
        this.users.set(data.content);
        this.totalPages.set(data.totalPages);
        this.currentPage.set(data.number);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los usuarios.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.usernameAvailable.set(null);
    this.form.reset({
      username: '',
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      rolId: 0,
      comercioId: this.auth.currentUser()?.comercioId ?? null,
      activo: true,
    });
    this.form.controls.password.setValidators([Validators.required]);
    this.showForm.set(true);
  }

  openEdit(user: User): void {
    this.editingId.set(user.id);
    this.usernameAvailable.set(null);
    this.form.reset({
      username: user.username,
      email: user.email,
      password: '',
      nombre: user.nombre ?? '',
      apellido: user.apellido ?? '',
      rolId: user.rolId,
      comercioId: user.comercioId ?? null,
      activo: user.activo,
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.error.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.usernameAvailable() === false) {
      this.error.set('El nombre de usuario no está disponible.');
      return;
    }

    const raw = this.form.getRawValue();
    const request: UsuarioRequest = {
      username: raw.username,
      email: raw.email,
      nombre: raw.nombre || undefined,
      apellido: raw.apellido || undefined,
      rolId: raw.rolId,
      comercioId: raw.comercioId ?? undefined,
      activo: raw.activo,
    };

    if (raw.password) {
      request.password = raw.password;
    }

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const op$ = id
      ? this.usuariosService.update(id, request)
      : this.usuariosService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.loadPage(this.currentPage());
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el usuario.');
      },
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`¿Eliminar usuario ${user.username}?`)) {
      return;
    }

    this.usuariosService.delete(user.id).subscribe({
      next: () => this.loadPage(this.currentPage()),
      error: (err) => this.error.set(err.error?.message ?? 'No se pudo eliminar el usuario.'),
    });
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.loadPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.loadPage(this.currentPage() + 1);
    }
  }

  private loadRoles(): void {
    this.rolesService.getAll().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.error.set('No se pudieron cargar los roles.'),
    });
  }
}
