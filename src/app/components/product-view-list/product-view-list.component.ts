import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';
import * as XLSX from 'xlsx';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { StockAlertService } from '../../services/stock-alert.service';

@Component({
  selector: 'app-product-view-list',
  templateUrl: './product-view-list.component.html',
  styleUrl: './product-view-list.component.css',
})
export class ProductViewListComponent implements OnInit {
  stockThreshold: number = 5; // Valor por defecto
  loading: boolean = false;
  isAdmin: boolean = false;
  fileName = 'ExcelSheet.xlsx'; // Nombre del archivo Excel a exportar.
  productos: Product[] = [];
  displayedColumns: string[] = [
    'select',
    'acciones',
    'imagen',
    'modelo',
    'nombre',
    // 'categoria',
    'talle',
    'color',
    'cantidad',
    'proveedor',
    'precio',
    'sku',
  ];
  dataSource = new MatTableDataSource<Product>();
  selectedProducts: Set<string> = new Set<string>(); // IDs de productos seleccionados

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  //NEW
  @ViewChild('barcodeCanvas', { static: false }) barcodeCanvas!: ElementRef;
  @ViewChild('input') input!: ElementRef;

  constructor(
    private productService: ProductService,
    private userService: UserService,
    private cartService: CartService,
    private dialog: MatDialog,
    private stockAlertService: StockAlertService,
    private snackBar: SnackbarService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.getProductos();
    this._isUserAdmin();
    this.obtenerUmbralStock();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  //NEW (Genera los códigos de barra de los productos para la vista)
  // ngAfterViewChecked() {
  //   // Generar los códigos de barras para cada producto después de que la vista ha sido renderizada
  //   this.productos.forEach((producto, index) => {
  //     const canvas = document.querySelectorAll('canvas')[index]; // Selecciona el canvas correspondiente
  //     if (producto.sku && canvas) {
  //       this.generateBarcodeImage(producto.sku, canvas);
  //     }
  //   });
  // }

  clearInput(input: HTMLInputElement) {
    input.value = '';
    this.applyFilter({ target: input } as unknown as Event); // Convierte primero a 'unknown' y luego a 'Event'
  }

  // generateBarcodeImage(code: string, canvas: HTMLCanvasElement): void {
  //   JsBarcode(canvas, code, {
  //     format: 'CODE128', // Puedes cambiar el formato si lo necesitas
  //     displayValue: true,
  //     fontSize: 12, // Tamaño más pequeño para el texto
  //     lineColor: '#000000',
  //     width: 1.5, // Ancho más pequeño para las líneas del código de barras
  //     height: 20, // Altura reducida del código de barras
  //     margin: 0, // Sin margen extra
  //   });
  // }

  generateSku(product: Product) {
    this.loading = true;
    const newSku = this.productService.generateSKU(product);
    this.productService.editarProducto(product.id, { sku: newSku });
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  obtenerUmbralStock() {
    this.stockAlertService.getStockThreshold().subscribe((threshold) => {
      this.stockThreshold = threshold;
    });
  }

  openBarcodeScanner(): void {
    const dialogRef = this.dialog.open(BarcodeScannerComponent, {
      width: '600px',
      height: '500px',
      data: {}, // Puedes pasar data si lo necesitas
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.input.nativeElement.value = result; // Inserta el código en el input
        this.applyFilter({ target: this.input.nativeElement } as Event); // Aplica el filtro
      }
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
    setTimeout(() => {
      this.productService.obtenerProductos().subscribe((data) => {
        this.productos = [];
        data.forEach((element: any) => {
          this.productos.push({
            id: element.payload.doc.id,
            ...element.payload.doc.data(),
          });
        });
        this.dataSource.data = this.productos;
        this.loading = false;
      });
    }, 500);
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
      autoFocus: false,
    });
    // Al cerrar el diálogo, limpiamos los productos seleccionados
    dialogRef.afterClosed().subscribe(() => {
      this.limpiarSeleccionProductos(); // Limpiar selección
    });
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
      } else {
        this.limpiarSeleccionProductos();
      }
    });
  }

  async moveProductToCart(product: Product) {
    const dialogRef = this.dialog.open(QtyDialogComponent, {
      width: '450px',
      data: { cantidad: 1, title: 'Agregar al Carrito' }, // Valor inicial
      autoFocus: false,
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
      width: '450px',
      data: { cantidad: null, title: 'Agregar Stock' },
      autoFocus: false,
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
            this.limpiarSeleccionProductos();
          });
      } else if (cantidadAgregar === undefined || cantidadAgregar === null) {
        // No hacer nada si el diálogo se cerró sin ingresar una cantidad válida
        return this.limpiarSeleccionProductos();
      } else {
        this.snackBar.showError('Cantidad inválida');
        this.limpiarSeleccionProductos();
      }
    });
  }

  restarStock(product: Product): void {
    // Abrir el diálogo para ingresar la cantidad
    const dialogRef = this.dialog.open(QtyDialogComponent, {
      width: '450px',
      data: { cantidad: null, title: 'Restar Stock' },
      autoFocus: false,
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
          return this.limpiarSeleccionProductos(); // Detener el proceso si la cantidad excede el stock
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
            this.limpiarSeleccionProductos();
          });
      } else if (cantidadAgregar === undefined || cantidadAgregar === null) {
        return this.limpiarSeleccionProductos(); // Si no se seleccionó una cantidad válida, no hacer nada
      } else {
        this.snackBar.showError('Cantidad inválida');
        this.limpiarSeleccionProductos();
      }
    });
  }

  toggleSelection(id: string): void {
    this.selectedProducts.has(id)
      ? this.selectedProducts.delete(id)
      : this.selectedProducts.add(id);
  }

  toggleSelectAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.dataSource.filteredData.forEach((row) =>
        this.selectedProducts.add(row.id)
      );
    } else {
      this.selectedProducts.clear();
    }
  }

  isSelected(id: string): boolean {
    return this.selectedProducts.has(id);
  }

  isAnyProductSelected(): boolean {
    return this.selectedProducts.size > 0;
  }

  isManyProductSelected(): boolean {
    return this.selectedProducts.size > 1;
  }

  getSelectedProduct(): any | null {
    const selectedIds = Array.from(this.selectedProducts);
    return (
      this.dataSource.filteredData.find(
        (product) => product.id === selectedIds[0]
      ) || null
    );
  }

  // Método para limpiar la selección de productos
  limpiarSeleccionProductos(): void {
    this.selectedProducts.clear();
  }

  async deleteSelectedProducts(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'confirm') {
        this.loading = true; // Iniciar el loading antes del if

        try {
          if (this.selectedProducts.size === 1) {
            const id = Array.from(this.selectedProducts)[0];
            await this.productService.eliminarProducto(id);
            this.snackBar.showSuccess('Producto eliminado con éxito');
            this.selectedProducts.clear();
          } else {
            await this.batchDeleteProducts();
          }
        } catch (error) {
          this.snackBar.showError('Error eliminando productos');
        } finally {
          this.loading = false; // Siempre ocultar el loading en el finally
        }
      } else {
        this.limpiarSeleccionProductos();
      }
    });
  }

  async batchDeleteProducts(): Promise<void> {
    const batchOperations = Array.from(this.selectedProducts).map((id) =>
      this.productService.eliminarProducto(id)
    );

    try {
      await Promise.all(batchOperations); // Ejecutar todas las eliminaciones en paralelo
      this.snackBar.showSuccess('Productos eliminados con éxito');
    } catch (error) {
      this.snackBar.showError('Error al eliminar productos');
    } finally {
      this.selectedProducts.clear(); // Limpiar selección después de la eliminación
    }
  }

  exportExcelSelection(): void {
    const selectedData = this.dataSource.data.filter((product) =>
      this.isSelected(product.id)
    );

    if (selectedData.length === 0) {
      this.snackBar.showError('Debe seleccionar al menos un producto');
      return;
    }

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      selectedData.map((product) => ({
        nombre: product.nombre,
        modelo: product.modelo,
        categoria: product.categoria,
        proveedor: product.proveedor,
        talle: product.talle,
        color: product.color,
        cantidad: product.cantidad,
        precio: product.precio,
        sku: product.sku,
      }))
    );

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos Seleccionados');
    XLSX.writeFile(wb, 'Productos_Seleccionados.xlsx');
    this.selectedProducts.clear();
  }
}
