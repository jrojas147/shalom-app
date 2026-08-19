import { Component } from '@angular/core';
import { CodigosCiiuConfigComponent } from './codigos-ciiu-config/codigos-ciiu-config.component';
import { MediosCajaConfigComponent } from './medios-caja-config/medios-caja-config.component';
import { TiposEmpaqueConfigComponent } from './tipos-empaque-config/tipos-empaque-config.component';

@Component({
  selector: 'app-parametrizacion',
  standalone: true,
  imports: [CodigosCiiuConfigComponent, TiposEmpaqueConfigComponent, MediosCajaConfigComponent],
  templateUrl: './parametrizacion.component.html',
  styleUrl: './parametrizacion.component.scss',
})
export class ParametrizacionComponent {}
