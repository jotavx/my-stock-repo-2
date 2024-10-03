import { Component, OnInit } from '@angular/core';
import { SnackbarService } from '../../services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { Provider } from '../../models/provider';
import { CreateProviderComponent } from '../create-provider/create-provider.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css',
})
export class ProveedoresComponent implements OnInit {
  providers: Provider[] = [];
  isAdmin: boolean = false;

  constructor(
    private snackBar: SnackbarService,
    public dialog: MatDialog,
    private providerService: ProviderService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.obtenerDatos();
    this._isUserAdmin();
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  obtenerDatos() {
    this.providerService.getProviders().subscribe((data) => {
      this.providers = [];
      data.forEach((element: any) => {
        const providerData = {
          id: element.payload.doc.id,
          ...element.payload.doc.data(),
        };
        this.providers.push(providerData);
      });
    });
  }

  eliminarProveedor(id: string): void {
    this.providerService.deleteProvider(id).then(
      () => this.snackBar.showSuccess('Se ha eliminado el proveedor'),
      (error) => {
        console.log('Error eliminando proveedor:', error);
        this.snackBar.showError('Se ha producido un error');
      }
    );
  }

  openDialog(content?: any): void {
    const dialogRef = this.dialog.open(CreateProviderComponent, {
      width: '600px',
      data: content,
    });
  }

  openDeleteDialog(proveedor: Provider): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '450px',
      data: { id: proveedor.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.eliminarProveedor(proveedor.id!);
      }
    });
  }
}
