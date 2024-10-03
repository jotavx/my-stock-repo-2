import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-create-provider',
  templateUrl: './create-provider.component.html',
  styleUrl: './create-provider.component.css',
})
export class CreateProviderComponent implements OnInit {
  formProvider: FormGroup;
  id: string | null;
  loading = false;
  titulo: string = 'Crear Proveedor';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private providerService: ProviderService,
    private snackBar: SnackbarService,
    private dialogRef: MatDialogRef<CreateProviderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.formProvider = this.fb.group({
      nombre: ['', Validators.required],
      contacto: ['', Validators.required],
    });
    this.id = data ? data.id : null;
  }

  ngOnInit(): void {
    this.esEditar();
  }

  agregarEditarProveedor() {
    this.submitted = true;
    if (this.formProvider.invalid) {
      return;
    }
    if (this.id) {
      this.modificarProveedor(this.id);
    } else {
      this.nuevoProveedor();
    }
  }

  nuevoProveedor() {
    const fechaActual = new Date();
    const proveedor: any = {
      nombre: this.formProvider.value.nombre.toUpperCase(),
      contacto: this.formProvider.value.contacto.toUpperCase(),
      fechaCreacion: fechaActual,
      fechaActualizacion: fechaActual,
    };

    this.loading = true;
    const nombreProveedor = this.formProvider.value.nombre.toUpperCase();
    const mensaje = `Proveedor creado: ${nombreProveedor}`;
    this.crearProveedor(proveedor, mensaje);
  }

  private crearProveedor(proveedor: any, mensaje: string) {
    this.providerService.createProvider(proveedor).subscribe(
      () => {
        this.snackBar.showSuccess(mensaje);
        this.loading = false;
        this.dialogRef.close();
      },
      (error) => {
        this.snackBar.showError('Se ha producido un error');
        console.log(error);
        this.loading = false;
      }
    );
  }

  modificarProveedor(id: string) {
    const fechaActual = new Date();
    const proveedor: any = {
      nombre: this.formProvider.value.nombre.toUpperCase(),
      contacto: this.formProvider.value.contacto.toUpperCase(),
      fechaActualizacion: fechaActual,
    };

    this.loading = true;
    const nombreProveedor = this.formProvider.value.nombre.toUpperCase();
    const mensaje = `Proveedor modificado: ${nombreProveedor}`;

    this.providerService.editProvider(id, proveedor).subscribe(
      () => {
        this.snackBar.showSuccess(mensaje);
        this.loading = false;
        this.dialogRef.close();
      },
      (error) => {
        this.snackBar.showError('Se ha producido un error');
        console.log(error);
        this.loading = false;
      }
    );
  }

  esEditar() {
    if (this.data) {
      this.formProvider.setValue({
        nombre: this.data.nombre || '',
        contacto: this.data.contacto || '',
      });
      this.titulo = 'Editar Proveedor';
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.agregarEditarProveedor();
    }
  }

  eliminarProveedor(): void {
    if (this.id) {
      this.loading = true;
      const nombreProveedor = this.formProvider.value.nombre.toUpperCase();
      const mensaje = `Proveedor eliminado: ${nombreProveedor}`;

      this.providerService
        .deleteProvider(this.id)
        .then(() => {
          this.snackBar.showSuccess(mensaje);
          this.loading = false;
          this.dialogRef.close();
        })
        .catch((error) => {
          this.snackBar.showError(
            'Se ha producido un error al eliminar el proveedor'
          );
          console.log(error);
          this.loading = false;
        });
    }
  }
}
