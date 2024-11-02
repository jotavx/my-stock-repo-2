import { Component } from '@angular/core';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ExcelService } from '../../services/excel.service';
import { SnackbarService } from '../../services/snackbar.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-import-excel',
  templateUrl: './import-excel.component.html',
  styleUrl: './import-excel.component.css',
})
export class ImportExcelComponent {
  proveedores: any[] = [];

  constructor(
    private excelService: ExcelService,
    private firestore: AngularFirestore,
    private router: Router,
    private snackBar: SnackbarService
  ) {
    this.loadProveedores();
  }

  // Cargar todos los proveedores desde la colección 'providers'
  loadProveedores() {
    this.firestore
      .collection('providers')
      .valueChanges({ idField: 'id' })
      .subscribe((data: any[]) => {
        this.proveedores = data;
      });
  }

  // Manejar la selección del archivo Excel
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.excelService
        .readExcel(file)
        .then((data) => {
          this.uploadToFirebaseBatch(data);
        })
        .catch((err) => console.error('Error leyendo el archivo Excel', err));
    }
  }

  uploadToFirebaseBatch(products: any[]) {
    const batch = this.firestore.firestore.batch(); // Crear el batch de Firestore
    let proveedoresNoEncontrados = false; // Bandera para proveedores faltantes
    let productosInvalidos = false; // Bandera para productos sin nombre, modelo o cantidad inválida

    products.forEach((product) => {
      // Verificar que el producto tenga nombre, modelo y una cantidad válida
      const tieneCamposObligatorios = product.nombre && product.modelo;
      const cantidadValida = product.cantidad >= 0;

      if (!tieneCamposObligatorios || !cantidadValida) {
        console.error(`Producto inválido:`, product);
        productosInvalidos = true;
      }

      // Limpiar espacios y convertir a minúsculas para comparar proveedores
      const proveedorExcel = product.proveedor?.trim().toLowerCase();

      // Buscar proveedor por nombre
      const matchingProveedor = this.proveedores.find(
        (prov) => prov.nombre.trim().toLowerCase() === proveedorExcel
      );

      if (matchingProveedor) {
        product.proveedor = matchingProveedor.nombre; // Asignar ID del proveedor
      } else {
        console.error(`Proveedor no encontrado: ${product.proveedor}`);
        proveedoresNoEncontrados = true;
      }
    });

    // Verificar si hubo productos inválidos o proveedores no encontrados
    if (productosInvalidos || proveedoresNoEncontrados) {
      const mensajeError = productosInvalidos
        ? 'Algunos productos no tienen nombre, modelo o tienen cantidad inválida.'
        : 'Algunos proveedores no se han encontrado. Créelos primero.';

      console.log(mensajeError);
      this.snackBar.showError(mensajeError);
      this.router.navigate(['/home']);
      return; // Detener la ejecución si hay errores
    }

    // Si todo es válido, proceder a ejecutar el batch
    products.forEach((product) => {
      const productRef = this.firestore.collection('products').doc().ref;
      batch.set(productRef, product); // Añadir la operación al batch
    });

    // Ejecutar el batch
    batch
      .commit()
      .then(() => {
        console.log('Productos agregados exitosamente en batch');
        this.snackBar.showSuccess('Productos agregados exitosamente');
        this.router.navigate(['/home']);
      })
      .catch((err) => {
        console.error('Error al agregar productos en batch', err);
        this.snackBar.showError('Error al agregar productos');
      });
  }

  // Subir productos a Firebase usando batch
  // uploadToFirebaseBatch(products: any[]) {
  //   const batch = this.firestore.firestore.batch(); // Crear el batch de Firestore
  //   let proveedoresNoEncontrados = false; // Bandera para verificar si faltan proveedores

  //   products.forEach((product) => {
  //     // Limpiar espacios en blanco y convertir a minúsculas para la comparación
  //     const proveedorExcel = product.proveedor.trim().toLowerCase();

  //     // Buscar el proveedor por nombre
  //     const matchingProveedor = this.proveedores.find(
  //       (prov) => prov.nombre.trim().toLowerCase() === proveedorExcel
  //     );

  //     if (matchingProveedor) {
  //       // Si el proveedor existe, asignar su ID al producto
  //       product.proveedor = matchingProveedor.nombre;
  //     } else {
  //       // Si no se encuentra el proveedor, marcar como no encontrado
  //       console.error(`Proveedor no encontrado: ${product.proveedor}`);
  //       proveedoresNoEncontrados = true;
  //     }
  //   });

  //   // Si hay proveedores que no se encontraron, no ejecutar el batch
  //   if (proveedoresNoEncontrados) {
  //     console.log(
  //       'Algunos proveedores no se han encontrado. El batch no se ejecutará.'
  //     );
  //     this.snackBar.showError(
  //       'Algunos proveedores no se han encontrado, crealos primero'
  //     );
  //     this.router.navigate(['/home']);
  //     return; // Detener la ejecución del batch
  //   }

  //   // Si todos los proveedores existen, proceder a ejecutar el batch
  //   products.forEach((product) => {
  //     // Referencia al documento donde se agregará el producto
  //     const productRef = this.firestore.collection('products').doc().ref;

  //     // Añadir la operación de escritura al batch
  //     batch.set(productRef, product);
  //   });

  //   // Ejecutar el batch
  //   batch
  //     .commit()
  //     .then(() => {
  //       console.log('Productos agregados exitosamente en batch');
  //       this.snackBar.showSuccess('Productos agregados exitosamente');
  //       this.router.navigate(['/home']);
  //     })
  //     .catch((err) => {
  //       console.error('Error al agregar productos en batch', err);
  //       this.snackBar.showError('Error al agregar productos');
  //     });
  // }
}
