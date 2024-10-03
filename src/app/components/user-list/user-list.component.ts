import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from '../../services/snackbar.service';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { EditUserComponent } from '../edit-user/edit-user.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit {
  users$?: Observable<User[]>;
  currentUserId: any | null = null;
  isAdmin: boolean = false;

  constructor(
    private userService: UserService,
    public dialog: MatDialog,
    private snackBar: SnackbarService
  ) {}

  async ngOnInit(): Promise<void> {
    this.users$ = this.userService.getUsers();
    this.currentUserId = await this.userService.getCurrentUserId();
    this._isUserAdmin();
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  getColor(colorName?: string): string {
    const colors: { [key: string]: string } = {
      rojo: '#fb0909',
      azul: '#0d09fb',
      amarillo: '#edfe06',
      verde: '#04ff00',
    };
    return colors[colorName?.toLowerCase() || ''] || '#ccc'; //
  }

  openDeleteDialog(userId: string): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '450px',
      data: { id: userId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.deleteUser(userId);
      }
    });
  }

  deleteUser(userId: string): void {
    this.userService
      .deleteUserAccount()
      .then(() => {
        this.snackBar.showSuccess('Usuario eliminado exitosamente');
      })
      .catch((error) => {
        console.error('Error al eliminar usuario:', error);
        // this.snackBar.showError('Error al eliminar usuario');
      });
  }

  onEditUser(user: User) {
    const dialogRef = this.dialog.open(EditUserComponent, {
      width: '600px',
      //data: { name: user.name, color: user.color },
      data: { name: user.name, color: user.color, role: user.role },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userService
          .updateUser(user.uid!, result)
          .then(() => console.log('Usuario actualizado'))
          .catch((err) => console.error('Error actualizando el usuario', err));
      }
    });
  }

  showDeleteButton(userId: string): boolean {
    return this.currentUserId === userId;
  }
}
