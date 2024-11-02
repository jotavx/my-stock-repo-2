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
    @Inject(MAT_DIALOG_DATA) public data: { cantidad: number; title: string }
  ) {}
  title: string = '';

  ngOnInit(): void {
    this.setTitle();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onEnter(): void {
    this.dialogRef.close(this.data.cantidad);
  }

  setTitle(): void {
    this.title = this.data.title;
  }
}
