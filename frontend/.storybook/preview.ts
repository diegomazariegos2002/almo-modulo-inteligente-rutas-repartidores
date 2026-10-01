import { provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, type Preview } from '@storybook/angular';

const preview: Preview = {
  decorators: [
    // Varios componentes usan `routerLink`. Este enrutador acepta cualquier dirección
    // sin pintar nada, y navega con «#» para no cambiar la URL del propio Storybook.
    applicationConfig({
      providers: [provideRouter([{ path: '**', children: [] }], withHashLocation())],
    }),
  ],
  parameters: {
    layout: 'padded',
    options: {
      storySort: { order: ['Shared', 'Auth', 'Ordenes', 'Repartidores'] },
    },
    viewport: {
      options: {
        movil: { name: 'Móvil (360 px)', styles: { width: '360px', height: '740px' } },
        tablet: { name: 'Tablet (768 px)', styles: { width: '768px', height: '1024px' } },
      },
    },
  },
};

export default preview;
