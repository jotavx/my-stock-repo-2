import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-qty-dialog',
  templateUrl: './qty-dialog.component.html',
  styleUrl: './qty-dialog.component.css',
})
export class QtyDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QtyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cantidad: number }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onEnter(): void {
    // Cierra el diálogo y envía la cantidad ingresada cuando se presiona Enter
    this.dialogRef.close(this.data.cantidad);
  }
}
