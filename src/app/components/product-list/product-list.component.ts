import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Product } from '../../models/product-model';
import { ProductService } from '../../services/product.service';
import { SnackbarService } from '../../services/snackbar.service';
import { CreateProductDialogComponent } from '../create-product-dialog/create-product-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { CartService } from '../../services/cart.service';
import { QtyDialogComponent } from '../qty-dialog/qty-dialog.component';
import { UserService } from '../../services/user.service';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  submitted = false;
  productos: Product[] = [];
  filteredProducts: Product[] = []; // Lista de productos filtrados
  searchControl = new FormControl(''); // Control de formulario para búsqueda
  data: any;
  skeletonCount: number = 6;
  skeletonArray: number[] = [];
  loading = true;
  isAdmin: boolean = false;

  constructor(
    private productService: ProductService,
    private snackBar: SnackbarService,
    public dialog: MatDialog,
    private userService: UserService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.obtenerDatos();
    this._isUserAdmin();

    // Suscribirse a los cambios en el control de búsqueda
    this.searchControl.valueChanges.subscribe((searchTerm: string | null) => {
      // Usa el operador ?? para manejar el valor null
      this.filtrarProductos(searchTerm ?? '');
    });
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  clearInput(input: HTMLInputElement): void {
    // Limpiar el valor del campo de entrada y el control de búsqueda
    input.value = '';
    this.searchControl.setValue(''); // Restablecer el control de búsqueda
    this.filtrarProductos(''); // Mostrar todos los productos de nuevo
  }

  openBarcodeScanner(): void {
    const dialogRef = this.dialog.open(BarcodeScannerComponent, {
      width: '600px',
      height: '500px',
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      if (result) {
        // Set the scanned code into the search input
        this.searchControl.setValue(result);
      }
    });
  }

  obtenerDatos() {
    this.skeletonArray = Array(this.skeletonCount).fill(0);
    setTimeout(() => {
      this.productService.obtenerProductos().subscribe((data) => {
        this.productos = [];
        this.filteredProducts = []; // Inicializa filteredProducts
        this.loading = false;
        data.forEach((element: any) => {
          const productData = {
            id: element.payload.doc.id,
            ...element.payload.doc.data(),
          };
          this.productos.push(productData);
          this.filteredProducts.push(productData); // Agrega los productos a filteredProducts también
        });
      });
    }, 500);
  }

  filtrarProductos(searchTerm: string): void {
    // Verifica si searchTerm está vacío
    if (!searchTerm) {
      this.filteredProducts = [...this.productos]; // Si el término está vacío, muestra todos los productos
      return;
    }

    // Filtra productos por nombre que coincidan con el término de búsqueda
    this.filteredProducts = this.productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.precio?.toString().includes(searchTerm.toLowerCase()) ||
        producto.barcode?.toString().includes(searchTerm.toLowerCase()) ||
        producto.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.talle.toString().includes(searchTerm.toLowerCase()) ||
        producto.cantidad.toString().includes(searchTerm.toLowerCase())
    );
  }

  // component.ts

  eliminarProducto(id: string): void {
    this.productService
      .eliminarProducto(id) // Pasa ambos argumentos
      .then(
        () => this.snackBar.showSuccess('Se ha eliminado el producto'),
        (error) => {
          console.log('Error eliminando producto:', error);
          this.snackBar.showError('Se ha producido un error');
        }
      );
  }

  openDialog(content?: any): void {
    const dialogRef = this.dialog.open(CreateProductDialogComponent, {
      width: '600px',
      data: content, // Pasa datos a través del diálogo si estás en modo de edición
    });
    // dialogRef.afterClosed().subscribe(() => {
    //   this.obtenerDatos();
    // });
  }

  openDeleteDialog(product: { id: string }): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '450px',
      data: { id: product.id }, // Pasar los datos al diálogo
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        // Llama a eliminarProducto con ambos argumentos
        this.eliminarProducto(product.id);
      }
    });
  }

  moveProductToCart(product: Product) {
    const dialogRef = this.dialog.open(QtyDialogComponent, {
      width: '450px',
      data: { cantidad: 1, title: 'Agregar al Carrito' }, // Valor inicial
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === undefined || result === null) {
        // El usuario canceló o cerró el diálogo, no hacer nada
        return;
      }

      const cantidadNumerica = parseInt(result, 10);

      if (
        !isNaN(cantidadNumerica) &&
        cantidadNumerica > 0 &&
        cantidadNumerica <= product.cantidad
      ) {
        // Si la cantidad es válida, agregar al carrito
        this.cartService.agregarAlCarrito(product, cantidadNumerica);
        this.snackBar.showSuccess(
          `Se agrego ${product.nombre} - ${product.modelo} al carrito`
        );
      } else {
        // Si la cantidad no es válida, mostrar alerta
        this.snackBar.showError('Cantidad inválida o stock insuficiente');
      }
    });
  }

  agregarStock(product: Product): void {
    // Abrir el diálogo para ingresar la cantidad
    const dialogRef = this.dialog.open(QtyDialogComponent, {
      width: '300px',
      data: { cantidad: null, title: 'Agregar Stock' },
    });

    // Cuando el diálogo se cierra, obtenemos la cantidad seleccionada
    dialogRef.afterClosed().subscribe((cantidadAgregar: number | undefined) => {
      if (cantidadAgregar !== undefined && cantidadAgregar > 0) {
        const cantidadNueva = product.cantidad + cantidadAgregar;

        // Actualizamos el producto en Firestore
        this.productService
          .editarProducto(product.id, { cantidad: cantidadNueva })
          .subscribe(() => {
            this.snackBar.showSuccess(
              `Se agregaron ${cantidadAgregar} unidades a ${product.nombre} - ${product.modelo}`
            );

            // Actualizar la cantidad en la lista local
            product.cantidad = cantidadNueva;
          });
      } else if (cantidadAgregar === undefined || cantidadAgregar === null) {
        // No hacer nada si el diálogo se cerró sin ingresar una cantidad válida
        return;
      } else {
        this.snackBar.showError('Cantidad inválida');
      }
    });
  }

  restarStock(product: Product): void {
    // Abrir el diálogo para ingresar la cantidad
    const dialogRef = this.dialog.open(QtyDialogComponent, {
      width: '300px',
      data: { cantidad: null, title: 'Restar Stock' },
    });

    // Cuando el diálogo se cierra, obtenemos la cantidad seleccionada
    dialogRef.afterClosed().subscribe((cantidadAgregar: number | undefined) => {
      if (cantidadAgregar !== undefined && cantidadAgregar > 0) {
        const cantidadNueva = product.cantidad - cantidadAgregar;

        // Verificar si el stock resultante sería menor a 0
        if (cantidadNueva < 0) {
          this.snackBar.showError(
            `No se pueden restar ${cantidadAgregar} unidades, el stock actual es ${product.cantidad}`
          );
          return; // Detener el proceso si la cantidad excede el stock
        }

        // Actualizamos el producto en Firestore
        this.productService
          .editarProducto(product.id, { cantidad: cantidadNueva })
          .subscribe(() => {
            this.snackBar.showSuccess(
              `Se restaron ${cantidadAgregar} unidades a ${product.nombre} - ${product.modelo}`
            );

            // Actualizar la cantidad en la lista local
            product.cantidad = cantidadNueva;
          });
      } else if (cantidadAgregar === undefined || cantidadAgregar === null) {
        return; // Si no se seleccionó una cantidad válida, no hacer nada
      } else {
        this.snackBar.showError('Cantidad inválida');
      }
    });
  }

  // moveProductToCart(product: Product) {
  //   const input = prompt('¿Cuántas unidades deseas agregar al carrito?');

  //   if (input === null) {
  //     // El usuario canceló la operación
  //     return;
  //   }

  //   const cantidadNumerica = parseInt(input || '0', 10);
  //   if (cantidadNumerica > 0 && cantidadNumerica <= product.cantidad) {
  //     this.cartService.agregarAlCarrito(product, cantidadNumerica);
  //   }
  //   if (
  //     isNaN(cantidadNumerica) ||
  //     cantidadNumerica <= 0 ||
  //     cantidadNumerica > product.cantidad
  //   ) {
  //     alert('Cantidad no válida o stock insuficiente.');
  //   }
  // }
}
