import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StockAlertService } from '../../services/stock-alert.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product-model';
import { QtyDialogComponent } from '../qty-dialog/qty-dialog.component';
import { UserService } from '../../services/user.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-low-stock',
  templateUrl: './low-stock.component.html',
  styleUrls: ['./low-stock.component.css'],
})
export class LowStockComponent implements OnInit {
  productosBajoStock: Product[] = [];
  cantidadProductosBajoStock: number = 0;

  isAdmin: boolean = false;
  productosPaginados: any[] = [];
  pageSize = 5;
  currentPage = 0;

  constructor(
    private stockAlertService: StockAlertService,
    private productService: ProductService,
    private userService: UserService,
    private snackBar: SnackbarService,
    private dialog: MatDialog // Inyectar MatDialog
  ) {}

  ngOnInit(): void {
    this.stockAlertService
      .observarStockBajo()
      .subscribe(({ productos, cantidad }) => {
        this.productosBajoStock = productos;
        this.cantidadProductosBajoStock = cantidad;
        this.applyPagination();
      });
    this._isUserAdmin();
  }

  applyPagination() {
    const startIndex = this.currentPage * this.pageSize;
    this.productosPaginados = this.productosBajoStock.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.applyPagination();
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  agregarStock(product: Product): void {
    // Abrir el diálogo para ingresar la cantidad
    const dialogRef = this.dialog.open(QtyDialogComponent, {
      width: '450px',
      data: { cantidad: null, title: 'Agregar Stock' }, // Inicializamos con una cantidad por defecto
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
}
