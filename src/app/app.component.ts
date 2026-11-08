import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RpSpinnerComponent } from './shared/components/rp-spinner/rp-spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RpSpinnerComponent],
  template: `
    <router-outlet />
    <app-rp-spinner />
  `,
  styles: ':host { display: block; min-height: 100vh; }',
})
export class AppComponent {}
