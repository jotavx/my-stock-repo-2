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
        data: { cantidad: cartItem.cantidad },
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
    const dialogRef = this.dialog.open(DiscountDialogComponent, {
      width: '350px',
      data: this.total,
    });

    dialogRef.afterClosed().subscribe((discount: number) => {
      if (discount !== undefined) {
        this.discount = discount;
      }
    });
  }

  deleteDiscount() {
    this.discount = 0;
  }

  getTotalWithDiscount(): number {
    return this.total - this.discount;
  }

  // realizarVenta(): void {
  //   this.userService.getUserProfile().subscribe((user) => {
  //     if (user && user.uid) {
  //       const venta = {
  //         productos: this.cartProducts,
  //         totalSinDescuento: this.getTotal(),
  //         totalConDescuento: this.getTotalWithDiscount(),
  //         vendedor: {
  //           id: user.uid,
  //           nombre: user.name,
  //           color: user.color,
  //         },
  //         fecha: new Date(),
  //       };

  //       this.firestore
  //         .collection('ventas')
  //         .add(venta)
  //         .then(() => {
  //           this.snackBar.showSuccess('Venta realizada exitosamente.');

  //           // Limpiar el carrito y reiniciar el descuento
  //           this.cartService
  //             .clearCart(this.cartProducts)
  //             .then(() => {
  //               this.cartProducts = [];
  //               this.discount = 0; // Reiniciar el descuento aquí
  //               this.router.navigate(['/sales']);
  //             })
  //             .catch((error) => {
  //               this.snackBar.showError('Error al limpiar el carrito.');
  //               console.error('Error al limpiar el carrito:', error);
  //             });
  //         })
  //         .catch((error) => {
  //           this.snackBar.showError('Error al realizar la venta.');
  //           console.error('Error al guardar la venta:', error);
  //         });
  //     } else {
  //       this.snackBar.showError('No se pudo obtener el usuario.');
  //     }
  //   });
  // }

  realizarVenta(): void {
    const venta = {
      productos: this.cartProducts,
      totalSinDescuento: this.getTotal(),
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
