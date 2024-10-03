import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css',
})
export class EditUserComponent {
  editUserForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editUserForm = new FormGroup({
      name: new FormControl(data.name, [
        Validators.required,
        Validators.maxLength(9),
      ]),
      color: new FormControl(data.color, Validators.required),
      role: new FormControl(data.role, Validators.required),
    });
  }

  get nameInvalid() {
    return (
      this.editUserForm.get('name')?.invalid &&
      this.editUserForm.get('name')?.touched
    );
  }

  onSave() {
    if (this.editUserForm.valid) {
      this.dialogRef.close(this.editUserForm.value);
    }
  }
}
