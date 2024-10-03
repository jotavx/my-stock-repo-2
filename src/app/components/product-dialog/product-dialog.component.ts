import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Product } from '../../models/product-model';
import { CartService } from '../../services/cart.service';
import { QtyDialogComponent } from '../qty-dialog/qty-dialog.component';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-product-dialog',
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.css'],
})
export class ProductDialogComponent implements OnInit {
  displayedColumns: string[] = [
    'imagen',
    // 'nombre',
    'modelo',
    'proveedor',
    'color',
    'cantidad',
    'talle',
    'precio',
    'acciones',
  ];
  dataSource = new MatTableDataSource<Product>(); // Instancia de MatTableDataSource

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private cartService: CartService,
    private dialog: MatDialog,
    private snackBar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: { productos: Product[] }
  ) {}

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource(this.data.productos);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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

    this.dataSource = new MatTableDataSource(this.data.productos); // Actualiza la tabla
  }
}

// const input = prompt('¿Cuántas unidades deseas agregar al carrito?');

// if (input === null) {
//   // El usuario canceló la operación
//   return;
// }

// const cantidadNumerica = parseInt(input || '0', 10);
// if (cantidadNumerica > 0 && cantidadNumerica <= product.cantidad) {
//   this.cartService.agregarAlCarrito(product, cantidadNumerica);
// }
// if (
//   isNaN(cantidadNumerica) ||
//   cantidadNumerica <= 0 ||
//   cantidadNumerica > product.cantidad
// ) {
//   alert('Cantidad no válida o stock insuficiente.');
// }
