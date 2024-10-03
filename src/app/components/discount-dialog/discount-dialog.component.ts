import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-discount-dialog',
  templateUrl: './discount-dialog.component.html',
})
export class DiscountDialogComponent {
  discountForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DiscountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public total: number,
    private fb: FormBuilder
  ) {
    this.discountForm = this.fb.group({
      discount: [
        null,
        [Validators.required, Validators.min(0), Validators.max(this.total)],
      ],
    });
  }

  applyDiscount() {
    if (this.discountForm.valid) {
      this.dialogRef.close(this.discountForm.value.discount);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
