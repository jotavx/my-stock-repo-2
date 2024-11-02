import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-descuento-dialog',
  templateUrl: './descuento-dialog.component.html',
  styleUrls: ['./descuento-dialog.component.css'],
})
export class DescuentoDialogComponent {
  tipoDescuento: 'monto' | 'porcentaje' = 'monto'; // Por defecto
  valorDescuento: number = null!;

  constructor(public dialogRef: MatDialogRef<DescuentoDialogComponent>) {}

  confirmar() {
    // Enviar los datos al componente padre
    this.dialogRef.close({
      tipo: this.tipoDescuento,
      valor: this.valorDescuento,
    });
  }

  cancelar() {
    this.dialogRef.close(); // Cerrar sin enviar datos
  }
}
