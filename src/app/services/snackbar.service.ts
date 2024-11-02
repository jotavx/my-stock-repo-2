// import { Injectable } from '@angular/core';
// import { MatSnackBar } from '@angular/material/snack-bar';

// @Injectable({
//   providedIn: 'root',
// })
// export class SnackbarService {
//   constructor(private snackBar: MatSnackBar) {}

//   showSuccess(mensaje: string) {
//     this.snackBar.open(mensaje, 'Cerrar', {
//       duration: 3000,
//       panelClass: ['snackbar-success'],
//     });
//   }

//   showError(mensaje: string) {
//     this.snackBar.open(mensaje, 'Cerrar', {
//       duration: 3000,
//       panelClass: ['snackbar-error'],
//     });
//   }
// }

import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  showSuccess(mensaje: string, config?: MatSnackBarConfig) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: config?.panelClass || 'custom-snackbar-success', // Clase personalizada
      ...config, // Sobreescribe opciones si es necesario
      verticalPosition: 'bottom',
    });
  }

  showError(mensaje: string, config?: MatSnackBarConfig) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: config?.panelClass || 'custom-snackbar-error', // Clase personalizada
      ...config, // Sobreescribe opciones si es necesario
      verticalPosition: 'bottom',
    });
  }
}
