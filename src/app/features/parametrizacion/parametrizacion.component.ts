import { Component, signal } from '@angular/core';
import { CodigosCiiuConfigComponent } from './codigos-ciiu-config/codigos-ciiu-config.component';
import { MediosCajaConfigComponent } from './medios-caja-config/medios-caja-config.component';
import { TiposEmpaqueConfigComponent } from './tipos-empaque-config/tipos-empaque-config.component';
import { TiposGastoConfigComponent } from './tipos-gasto-config/tipos-gasto-config.component';
import { RpModalComponent } from '../../shared/components/rp-modal/rp-modal.component';

export type CatalogoParamId = 'ciiu' | 'empaque' | 'gasto' | 'medios';

interface CatalogoParam {
  id: CatalogoParamId;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-parametrizacion',
  standalone: true,
  imports: [
    CodigosCiiuConfigComponent,
    TiposEmpaqueConfigComponent,
    MediosCajaConfigComponent,
    TiposGastoConfigComponent,
    RpModalComponent,
  ],
  templateUrl: './parametrizacion.component.html',
  styleUrl: './parametrizacion.component.scss',
})
export class ParametrizacionComponent {
  readonly catalogos: CatalogoParam[] = [
    {
      id: 'ciiu',
      titulo: 'Grupo de materiales',
      descripcion: 'Códigos SUI disponibles para clasificar productos.',
    },
    {
      id: 'empaque',
      titulo: 'Tipos de empaque',
      descripcion: 'Empaques y tara usados en compras y ventas.',
    },
    {
      id: 'gasto',
      titulo: 'Tipos de gasto',
      descripcion: 'Categorías para registrar gastos operativos.',
    },
    {
      id: 'medios',
      titulo: 'Medios de pago de caja',
      descripcion: 'Efectivo, Nequi, Daviplata y cuentas bancarias.',
    },
  ];

  readonly catalogoActivo = signal<CatalogoParam | null>(null);

  abrirCatalogo(catalogo: CatalogoParam): void {
    this.catalogoActivo.set(catalogo);
  }

  cerrarCatalogo(): void {
    this.catalogoActivo.set(null);
  }
}
