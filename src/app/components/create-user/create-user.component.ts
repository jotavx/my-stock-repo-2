import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css'],
})
export class CreateUserComponent {
  formCreateUser: FormGroup;

  constructor(
    private userService: UserService,
    private router: Router,
    private snackBar: SnackbarService
  ) {
    this.formCreateUser = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(9)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      color: new FormControl(''),
      role: new FormControl('', Validators.required),
      ventas: new FormControl(0),
    });
  }

  get nameInvalid() {
    return (
      this.formCreateUser.get('name')?.invalid &&
      this.formCreateUser.get('name')?.touched
    );
  }

  get passwordInvalid() {
    return (
      this.formCreateUser.get('password')?.invalid &&
      this.formCreateUser.get('password')?.touched
    );
  }

  onSubmit() {
    const { name, email, password, role, color, ventas } =
      this.formCreateUser.value;
    this.userService
      .createUser(name, email, password, role, color, ventas)
      .then(() => {
        this.snackBar.showSuccess('Usuario Registrado');
        this.router.navigate(['/home']);
      })
      .catch((error) => {
        this.snackBar.showError('Se ha producido un error');
        console.error('Error creating user:', error);
      });
  }
}
