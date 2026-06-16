import { Component } from '@angular/core';
import { TiposEmpaqueConfigComponent } from './tipos-empaque-config/tipos-empaque-config.component';

@Component({
  selector: 'app-parametrizacion',
  standalone: true,
  imports: [TiposEmpaqueConfigComponent],
  templateUrl: './parametrizacion.component.html',
  styleUrl: './parametrizacion.component.scss',
})
export class ParametrizacionComponent {}
