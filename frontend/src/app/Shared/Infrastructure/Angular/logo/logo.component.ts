import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marca del producto: un trazo entre dos puntos y el nombre «Rutas». */
@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {}
