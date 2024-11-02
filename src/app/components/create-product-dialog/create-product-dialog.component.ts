// create-product-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { SnackbarService } from '../../services/snackbar.service';
import { Provider } from '../../models/provider';
import { ProviderService } from '../../services/provider.service';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-create-product-dialog',
  templateUrl: './create-product-dialog.component.html',
  styleUrls: ['./create-product-dialog.component.css'],
})
export class CreateProductDialogComponent implements OnInit {
  creacionProducto: FormGroup;
  providers: Provider[] = [];
  id: string | null;
  loading = false;
  titulo: string = 'Crear Producto';
  submitted = false;

  //NEW
  lastScanResult: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private providerService: ProviderService,
    private snackBar: SnackbarService,
    private dialogRef: MatDialogRef<CreateProductDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.creacionProducto = this.fb.group({
      nombre: ['', Validators.required],
      modelo: ['', Validators.required],
      categoria: [''],
      proveedor: [''],
      imagen: [''],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      precio: [0],
      talle: [''],
      color: [''],
      barcode: [''],
    });
    this.id = data ? data.id : null;
  }

  ngOnInit(): void {
    this.esEditar();
    this.obtenerProveedores();
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault(); // Previene la acción predeterminada del "Enter"
    // Tu lógica aquí
  }

  abrirEscanerCodigoBarras() {
    const dialogRef = this.dialog.open(BarcodeScannerComponent, {
      width: '600px',
      height: '500px',
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.creacionProducto.patchValue({ barcode: resultado });

        //NEW
        this.clearPreviousScanData();
      }
    });
  }

  //NEW
  clearPreviousScanData() {
    this.lastScanResult = null; // Borra el resultado anterior
    console.log('Datos del escaneo anterior eliminados');
  }

  agregarEditarProducto() {
    this.submitted = true;
    if (this.creacionProducto.invalid) {
      return;
    }
    if (this.id) {
      this.modificarProducto(this.id);
    } else {
      this.nuevoProducto();
    }
  }

  //NEW
  // generateProductSKU(product: Product) {
  //   const sku = this.productService.generateSKU(product);
  //   console.log('Generated SKU:', sku); // Aquí puedes usar el SKU como lo necesites
  //   // Por ejemplo, guardarlo en el producto o enviarlo a la base de datos
  //   product.sku = sku;
  // }

  nuevoProducto() {
    const fechaActual = new Date();
    const producto: any = {
      nombre: this.creacionProducto.value.nombre.toUpperCase(),
      modelo: this.creacionProducto.value.modelo.toUpperCase(),
      categoria: this.creacionProducto.value.categoria,
      proveedor: this.creacionProducto.value.proveedor.toUpperCase(),
      cantidad: this.creacionProducto.value.cantidad,
      precio: this.creacionProducto.value.precio,
      talle: this.creacionProducto.value.talle,
      color: this.creacionProducto.value.color.toUpperCase(),
      imagen: this.creacionProducto.value.imagen,
      fechaCreacion: fechaActual,
      fechaActualizacion: fechaActual,

      // Asegúrate de tener el campo sku en el modelo Product
      sku: '', // Inicialmente vacío, lo vamos a generar
      barcode: this.creacionProducto.value.barcode,
    };

    // Generar el SKU usando el método del servicio
    producto.sku = this.productService.generateSKU(producto);

    this.loading = true;
    const nombreProducto = this.creacionProducto.value.nombre.toUpperCase();
    const modeloProducto = this.creacionProducto.value.modelo.toUpperCase();
    const mensaje = `Producto creado: ${nombreProducto} - ${modeloProducto}`;
    this.crearProducto(producto, mensaje);
  }

  private crearProducto(producto: any, mensaje: string) {
    this.productService.crearProducto(producto).subscribe(
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

  modificarProducto(id: string) {
    const fechaActual = new Date();
    const producto: any = {
      nombre: this.creacionProducto.value.nombre.toUpperCase(),
      modelo: this.creacionProducto.value.modelo.toUpperCase(),
      categoria: this.creacionProducto.value.categoria.toUpperCase(),
      proveedor: this.creacionProducto.value.proveedor.toUpperCase(),
      cantidad: this.creacionProducto.value.cantidad,
      precio: this.creacionProducto.value.precio,
      talle: this.creacionProducto.value.talle,
      color: this.creacionProducto.value.color.toUpperCase(),
      imagen: this.creacionProducto.value.imagen,
      fechaActualizacion: fechaActual,

      // Asegúrate de tener el campo sku en el modelo Product
      sku: '', // Nuevamente vacío, por si hay modificación en los campos
      barcode: this.creacionProducto.value.barcode,
    };
    // Generar el SKU usando el método del servicio
    producto.sku = this.productService.generateSKU(producto);

    this.loading = true;
    const nombreProducto = this.creacionProducto.value.nombre.toUpperCase();
    const modeloProducto = this.creacionProducto.value.modelo.toUpperCase();
    const mensaje = `Producto modificado: ${nombreProducto} - ${modeloProducto}`;

    this.productService.editarProducto(id, producto).subscribe(
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
      this.creacionProducto.setValue({
        nombre: this.data.nombre || '',
        modelo: this.data.modelo || '',
        categoria: this.data.categoria || '',
        proveedor: this.data.proveedor || '',
        imagen: this.data.imagen || '',
        cantidad: this.data.cantidad || '',
        precio: this.data.precio || '',
        talle: this.data.talle || '',
        color: this.data.color || '',
        barcode: this.data.barcode || '',
      });
      this.titulo = 'Editar Producto';
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.agregarEditarProducto();
    }
  }

  eliminarProducto(): void {
    if (this.id) {
      this.loading = true;
      const nombreProducto = this.creacionProducto.value.nombre.toUpperCase();
      const mensaje = `Producto eliminado: ${nombreProducto}`;

      this.productService
        .eliminarProducto(this.id)
        .then(() => {
          this.snackBar.showSuccess(mensaje);
          this.loading = false;
          this.dialogRef.close();
        })
        .catch((error) => {
          this.snackBar.showError(
            'Se ha producido un error al eliminar el producto'
          );
          console.log(error);
          this.loading = false;
        });
    }
  }

  obtenerProveedores() {
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
}
