import { Component } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';
import { MatDialog } from '@angular/material/dialog';
import { QtyDialogComponent } from '../qty-dialog/qty-dialog.component';
import { SnackbarService } from '../../services/snackbar.service';
import { DiscountDialogComponent } from '../discount-dialog/discount-dialog.component';
import { UserService } from '../../services/user.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';
import { ProductService } from '../../services/product.service';
import { take } from 'rxjs';
import { DescuentoDialogComponent } from '../descuento-dialog/descuento-dialog.component';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent {
  total: number = 0;
  discount: number = 0;
  cartProducts: Cart[] = [];

  userId: any | null = null;
  userName: string | null = null;
  userColor: string | null = null;

  constructor(
    private cartService: CartService,
    public dialog: MatDialog,
    public snackBar: SnackbarService,
    private firestore: AngularFirestore,
    private userService: UserService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCartProducts();
    this.loadUserInfo();
  }

  getCartProducts() {
    this.cartService.getCartCollection().subscribe((data) => {
      this.cartProducts = [];
      data.forEach((element: any) => {
        this.cartProducts.push({
          id: element.payload.doc.id,
          ...element.payload.doc.data(),
        });
      });
      this.total = this.getTotal();
    });
  }

  loadUserInfo(): void {
    this.userService.getCurrentUserId().then((id) => {
      this.userId = id;
      if (id) {
        this.userService.getUser(this.userId).subscribe((resultado) => {
          const user = resultado.payload.data();
          this.userName = user.name;
          this.userColor = user.color;
        });
      }
    });
  }

  getTotal(): number {
    return this.cartProducts.reduce(
      (sum, item) => sum + (item.subtotal || 0),
      0
    );
  }

  eliminarDelCarrito(cartItem: Cart): void {
    if (cartItem.cantidad === 1) {
      // Eliminar sin diálogo si solo hay 1 unidad
      this.cartService
        .eliminarDelCarrito(cartItem.id)
        .then(() =>
          this.snackBar.showSuccess(
            `Eliminado del carrito: (1) ${cartItem.nombre} - ${cartItem.modelo} `
          )
        )
        .catch((error) => {
          this.snackBar.showError('Se ha producido un error');
          console.error('Error al eliminar el producto:', error);
        });
    } else {
      // Abrir el diálogo para ingresar la cantidad a eliminar
      const dialogRef = this.dialog.open(QtyDialogComponent, {
        width: '450px',
        data: { cantidad: cartItem.cantidad, title: 'Eliminar del Carrito' },
      });

      dialogRef.afterClosed().subscribe((cantidadEliminar) => {
        if (cantidadEliminar !== undefined && cantidadEliminar > 0) {
          if (cantidadEliminar > cartItem.cantidad) {
            this.snackBar.showError('Ingrese una cantidad válida');
          } else {
            this.cartService
              .eliminarDelCarrito(cartItem.id, cantidadEliminar)
              .then(() =>
                this.snackBar.showSuccess(
                  `Eliminado del carrito: (${cantidadEliminar}) ${cartItem.nombre} - ${cartItem.modelo} `
                )
              )
              .catch((error) => {
                this.snackBar.showError('Se ha producido un error');
                console.error('Error al eliminar el producto:', error);
              });
          }
        }
      });
    }
  }

  applyDiscount(): void {
    const dialogRef = this.dialog.open(DescuentoDialogComponent, {
      width: '450px',
      data: this.total,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const { tipo, valor } = result;

        if (tipo === 'monto') {
          this.discount = valor <= this.total ? valor : this.total;
        } else if (tipo === 'porcentaje') {
          this.discount = this.total * (valor / 100);
        }
      }
    });
  }

  deleteDiscount() {
    this.discount = 0;
  }

  getTotalWithDiscount(): number {
    return this.total - this.discount;
  }

  openBarcodeScanner(): void {
    const dialogRef = this.dialog.open(BarcodeScannerComponent, {
      width: '600px',
      height: '500px',
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((scannedCode) => {
        if (scannedCode) {
          this.productService
            .getProductByCode(scannedCode)
            .pipe(take(1))
            .subscribe(
              (product) => {
                if (product?.cantidad === 0) {
                  this.snackBar.showError(
                    `No tienes stock suficiente para ${product.nombre} - ${product.modelo}`
                  );
                } else if (product) {
                  console.log('Producto:', product.nombre, product.barcode);
                  this.cartService
                    .agregarAlCarrito(product, 1)
                    .then(() => {
                      this.snackBar.showSuccess(
                        `${product.nombre} - ${product.modelo} agregado al carrito`
                      );
                      dialogRef.close(); // Asegúrate de cerrar el diálogo después de agregar el producto
                    })
                    .catch((error) => {
                      console.error('Error al agregar al carrito:', error);
                      this.snackBar.showError(
                        'Error al agregar el producto al carrito.'
                      );
                    });
                } else {
                  this.snackBar.showError('Producto no encontrado.');
                }
              },
              (error) => {
                console.error(
                  'Error al obtener el producto por código:',
                  error
                );
                this.snackBar.showError('Error al buscar el producto.');
              }
            );
        }
      });
  }

  clearInput(input: HTMLInputElement) {
    input.value = '';
  }

  agregarProductoPorCodigo(scannedCode: string, input: HTMLInputElement): void {
    this.productService
      .getProductByCode(scannedCode)
      .pipe(take(1))
      .subscribe(
        (product) => {
          if (product?.cantidad === 0) {
            this.snackBar.showError(
              `No tienes stock suficiente para ${product.nombre} - ${product.modelo}`
            );
            this.clearInput(input);
          } else if (product) {
            // console.log('Producto:', product.nombre, product.barcode);
            this.cartService
              .agregarAlCarrito(product, 1)
              .then(() => {
                this.snackBar.showSuccess(
                  `${product.nombre} - ${product.modelo} agregado al carrito`
                );
                this.clearInput(input);
              })
              .catch((error) => {
                console.error('Error al agregar al carrito:', error);
                this.snackBar.showError(
                  'Error al agregar el producto al carrito.'
                );
                this.clearInput(input);
              });
          } else {
            this.snackBar.showError('Producto no encontrado.');
            this.clearInput(input);
          }
        },
        (error) => {
          console.error('Error al obtener el producto por código:', error);
          this.snackBar.showError('Error al buscar el producto.');
        }
      );
  }

  realizarVenta(): void {
    const venta = {
      productos: this.cartProducts,
      totalSinDescuento: this.getTotal(),
      descuento: this.getTotal() - this.getTotalWithDiscount(),
      totalConDescuento: this.getTotalWithDiscount(),

      vendedor: {
        id: this.userId,
        nombre: this.userName,
        color: this.userColor,
      },
      fecha: new Date(),
    };

    this.firestore
      .collection('ventas')
      .add(venta)
      .then(() => {
        this.snackBar.showSuccess('Venta realizada exitosamente.');
        this.cartService
          .deleteCartProducts(this.cartProducts)
          .then(() => {
            this.cartProducts = [];
            this.discount = 0; // Reiniciar el descuento aquí
            this.router.navigate(['/sales']);
          })
          .catch((error) => {
            this.snackBar.showError('Error al limpiar el carrito.');
            console.error('Error al limpiar el carrito:', error);
          });
      })

      .catch((error) => {
        this.snackBar.showError('Error al realizar la venta.');
        console.error('Error al guardar la venta:', error);
      });
  }

  openVentaDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        // Llama a eliminarProducto con ambos argumentos
        this.realizarVenta();
      }
    });
  }

  _clearCart() {
    this.cartService
      .clearCart(this.cartProducts)
      .then((result) => {
        this.snackBar.showSuccess('Se ha vaciado el carrito');
      })
      .catch((error) => {
        this.snackBar.showError('Se ha producido un error');
        console.log('Error al vaciar carrito', error);
      });
  }

  openClearCartDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        // Llama a eliminarProducto con ambos argumentos
        this._clearCart();
      }
    });
  }
}
