import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Product } from '../../models/product-model';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { CartService } from '../../services/cart.service';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from '../../services/snackbar.service';
import { ProductService } from '../../services/product.service';
import { QtyDialogComponent } from '../qty-dialog/qty-dialog.component';
import { UserService } from '../../services/user.service';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { CreateProductDialogComponent } from '../create-product-dialog/create-product-dialog.component';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-product-view-list',
  templateUrl: './product-view-list.component.html',
  styleUrl: './product-view-list.component.css',
})
export class ProductViewListComponent implements OnInit {
  isAdmin: boolean = false;
  productos: Product[] = [];
  displayedColumns: string[] = [
    'select',
    'imagen',
    'modelo',
    'nombre',
    'categoria',
    'talle',
    'color',
    'cantidad',
    'proveedor',

    'precio',
    'acciones',
  ];
  dataSource = new MatTableDataSource<Product>();
  selection = new SelectionModel<Product>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private userService: UserService,
    private cartService: CartService,
    private dialog: MatDialog,
    private snackBar: SnackbarService
  ) {}

  ngOnInit() {
    this.getProductos();
    this._isUserAdmin();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getProductos() {
    this.productService.obtenerProductos().subscribe((data) => {
      this.productos = [];
      data.forEach((element: any) => {
        this.productos.push({
          id: element.payload.doc.id,
          ...element.payload.doc.data(),
        });
      });
      this.dataSource.data = this.productos;
    });
  }

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

  async moveProductToCart(product: Product) {
    const dialogRef = this.dialog.open(QtyDialogComponent, {
      width: '450px',
      data: { cantidad: 1 }, // Valor inicial
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result === null || result === undefined) {
      // El usuario canceló la operación
      return;
    }

    const cantidadNumerica = parseInt(result || '0', 10);
    if (cantidadNumerica > 0 && cantidadNumerica <= product.cantidad) {
      await this.cartService.agregarAlCarrito(product, cantidadNumerica);
      product.cantidad -= cantidadNumerica; // Actualiza la cantidad en el arreglo original
      this.snackBar.showSuccess(
        `Se agregó ${product.nombre} - ${product.modelo} al carrito`
      );
    } else {
      this.snackBar.showError('Cantidad inválida');
    }
  }

  agregarStock(product: Product): void {
    // Abrir el diálogo para ingresar la cantidad
    const dialogRef = this.dialog.open(QtyDialogComponent, {
      width: '300px',
      data: { cantidad: null }, // Inicializamos con una cantidad por defecto
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
      data: { cantidad: null }, // Inicializamos con una cantidad por defecto
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

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: Product): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'}
    }`;
  }
}
