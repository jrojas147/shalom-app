import { Component, input } from '@angular/core';

export type NavIconName =
  | 'inicio'
  | 'compra'
  | 'caja'
  | 'venta'
  | 'liquidacion'
  | 'productos'
  | 'inventario'
  | 'proveedores'
  | 'clientes'
  | 'aliados'
  | 'sucursales'
  | 'usuarios'
  | 'parametrizacion'
  | 'perfil';

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      @switch (name()) {
        @case ('inicio') {
          <path
            d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        }
        @case ('compra') {
          <circle cx="9" cy="20" r="1.5" stroke="currentColor" stroke-width="1.8" />
          <circle cx="17" cy="20" r="1.5" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M3 4h2l2.2 10.5a1 1 0 001 .8h8.6a1 1 0 00.98-.8L19 7H6"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }
        @case ('caja') {
          <path
            d="M3 7.5h18v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5v-11z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M3 10h18" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M8 7.5V6a2 2 0 012-2h4a2 2 0 012 2v1.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        }
        @case ('venta') {
          <path
            d="M9 4h6l1 3H8l1-3z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M7 7h10l-1.2 11H8.2L7 7z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        }
        @case ('liquidacion') {
          <path
            d="M7 4h10a1 1 0 011 1v14l-3-2-3 2-3-2-3 2V5a1 1 0 011-1z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        }
        @case ('productos') {
          <path d="M12 5l4 7H8l4-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          <rect x="5" y="14" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.8" />
          <circle cx="17" cy="17" r="3" stroke="currentColor" stroke-width="1.8" />
        }
        @case ('inventario') {
          <path
            d="M4 7.5L12 4l8 3.5V18a1 1 0 01-.6.9L12 21l-7.4-2.1A1 1 0 014 18V7.5z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M12 8v13M4 7.5l8 3.5 8-3.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        }
        @case ('proveedores') {
          <circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.8" />
          <path d="M3 19c0-3.3 2.7-5 6-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="17" cy="10" r="2.5" stroke="currentColor" stroke-width="1.8" />
          <path d="M14 19c0-2.5 1.8-4 4.5-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        }
        @case ('clientes') {
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" />
          <path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        }
        @case ('aliados') {
          <path
            d="M8 11l2.5 2.5L16 8"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M6 14c1.5 1 3.5 1.5 6 1.5s4.5-.5 6-1.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path
            d="M7 17.5h10"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        }
        @case ('usuarios') {
          <circle cx="10" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8" />
          <path d="M4 19c0-3 2.7-5 6-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="17" cy="17" r="3" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M17 15.2v1.6M17 18.2v1.6M15.2 17h1.6M18.2 17h1.6"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        }
        @case ('sucursales') {
          <path
            d="M4 20h16M6 20V9l6-4 6 4v11"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M10 13h4v7h-4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        }
        @case ('parametrizacion') {
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        }
        @case ('perfil') {
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
          <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.8" />
          <path d="M7.5 17.5c1-2 2.7-3 4.5-3s3.5 1 4.5 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: flex;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    svg {
      width: 20px;
      height: 20px;
    }
  `,
})
export class NavIconComponent {
  readonly name = input.required<NavIconName>();
}
