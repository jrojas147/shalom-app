import { Component } from '@angular/core';
import { CategoriasProductoConfigComponent } from './categorias-producto-config/categorias-producto-config.component';
import { TiposEmpaqueConfigComponent } from './tipos-empaque-config/tipos-empaque-config.component';

@Component({
  selector: 'app-parametrizacion',
  standalone: true,
  imports: [CategoriasProductoConfigComponent, TiposEmpaqueConfigComponent],
  templateUrl: './parametrizacion.component.html',
  styleUrl: './parametrizacion.component.scss',
})
export class ParametrizacionComponent {}
