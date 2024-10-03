import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Product } from '../models/product-model';
import { Cart } from '../models/cart.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  constructor(private firestore: AngularFirestore) {}

  getCartCollection(): Observable<any> {
    return this.firestore
      .collection('cart', (ref) => ref.orderBy('cantidad', 'desc'))
      .snapshotChanges();
  }

  async agregarAlCarrito(product: Product, qty: number) {
    try {
      // Buscar si el producto ya está en el carrito
      const cartItemsSnapshot = await firstValueFrom(
        this.firestore
          .collection('cart', (ref) =>
            ref.where('idOriginal', '==', product.id)
          )
          .get()
      );

      if (!cartItemsSnapshot.empty) {
        // El producto ya está en el carrito, actualizar la cantidad
        const cartItem = cartItemsSnapshot.docs[0];
        const currentCartItem = cartItem.data() as Cart;

        // Sumar la nueva cantidad a la existente
        const nuevaCantidad = currentCartItem.cantidad + qty;

        // Actualizar el stock del producto original
        const nuevoStock = product.cantidad - qty;

        await this.firestore
          .collection('products')
          .doc(product.id)
          .update({ cantidad: nuevoStock });

        // Actualizar el producto en el carrito con la nueva cantidad
        await this.firestore
          .collection('cart')
          .doc(cartItem.id)
          .update({
            cantidad: nuevaCantidad,
            subtotal: product.precio * nuevaCantidad,
          });
      } else {
        // El producto no está en el carrito, agregarlo como nuevo
        const nuevoStock = product.cantidad - qty;

        // Actualizar el stock del producto original
        await this.firestore
          .collection('products')
          .doc(product.id)
          .update({ cantidad: nuevoStock });

        // Crear una copia del producto con la cantidad específica para el carrito
        const productToCart: Cart = {
          ...product, // Copia todas las propiedades del producto
          id: this.firestore.createId(),
          cantidad: qty,
          idOriginal: product.id,
          subtotal: product.precio * qty,
        };

        // Agregar el producto al carrito
        await this.firestore
          .collection('cart')
          .doc(productToCart.id)
          .set(productToCart);
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
    }
  }

  async eliminarDelCarrito(cartItemId: string, cantidadEliminar?: number) {
    try {
      const cartItemSnapshot = await firstValueFrom(
        this.firestore.collection('cart').doc(cartItemId).get()
      );
      const cartItem = cartItemSnapshot.data() as Cart;

      if (cartItem && cartItem.idOriginal) {
        const productSnapshot = await firstValueFrom(
          this.firestore.collection('products').doc(cartItem.idOriginal).get()
        );

        if (!productSnapshot.exists) {
          // Si el producto original no existe, eliminar directamente del carrito
          await this.firestore.collection('cart').doc(cartItemId).delete();
          console.log(
            `Producto ${cartItem.nombre} eliminado del carrito porque no existe en la colección 'products'.`
          );
          return;
        }

        const product = productSnapshot.data() as Product;

        if (product) {
          if (!cantidadEliminar || cantidadEliminar >= cartItem.cantidad) {
            // Si no se especifica cantidad o se elimina todo, actualiza el stock y elimina el item del carrito
            const nuevoStock = product.cantidad + cartItem.cantidad;
            await this.firestore
              .collection('products')
              .doc(cartItem.idOriginal)
              .update({ cantidad: nuevoStock });
            await this.firestore.collection('cart').doc(cartItemId).delete();
          } else {
            // Actualiza el stock y la cantidad en el carrito
            const nuevoStock = product.cantidad + cantidadEliminar;
            const nuevaCantidad = cartItem.cantidad - cantidadEliminar;
            await this.firestore
              .collection('products')
              .doc(cartItem.idOriginal)
              .update({ cantidad: nuevoStock });
            await this.firestore
              .collection('cart')
              .doc(cartItemId)
              .update({
                cantidad: nuevaCantidad,
                subtotal: product.precio * nuevaCantidad,
              });
          }
        }
      }
    } catch (error) {
      console.error('Error eliminando del carrito:', error);
    }
  }

  getTotalProductosEnCarrito(): Observable<number> {
    return this.firestore
      .collection('cart')
      .valueChanges()
      .pipe(
        map((productos: any[]) => {
          return productos.reduce(
            (total, producto) => total + producto.cantidad,
            0
          );
        })
      );
  }

  async clearCart(cartItems: Cart[]): Promise<void> {
    const batch = this.firestore.firestore.batch();

    for (const item of cartItems) {
      const productRef = this.firestore
        .collection('products')
        .doc(item.idOriginal).ref;
      const cartRef = this.firestore.collection('cart').doc(item.id).ref;

      try {
        // Actualizar la cantidad del producto en su ID original
        const productSnapshot = await productRef.get();
        if (productSnapshot.exists) {
          const productData = productSnapshot.data() as Product;
          const newStock = productData.cantidad + item.cantidad;

          batch.update(productRef, { cantidad: newStock });
        }
        // Eliminar el producto del carrito
        batch.delete(cartRef);
      } catch (error) {
        console.error('Error al devolver el producto:', error);
      }
    }

    try {
      // Ejecutar el batch
      await batch.commit();
      console.log('Carrito limpiado y productos devueltos al stock original');
    } catch (error) {
      console.error('Error al limpiar el carrito:', error);
    }
  }

  deleteCartProducts(cartItems: Cart[]): Promise<void> {
    const batch = this.firestore.firestore.batch();
    cartItems.forEach((item) => {
      const docRef = this.firestore.collection('cart').doc(item.id).ref;
      batch.delete(docRef);
    });
    return batch.commit(); // Elimina todos los documentos en una operación por lotes
  }
}
//ORIGINAL
//  agregarAlCarrito(product: Product, qty: number) {
//   const nuevoStock = product.cantidad - qty;

//   // Actualizar el stock del producto original
//   this.firestore
//     .collection('products')
//     .doc(product.id)
//     .update({ cantidad: nuevoStock });

//   this.firestore.collection('cart').doc(product.id).update({ cantidad: qty });

//   // Crear una copia del producto con la cantidad específica para el carrito
//   const productToCart = {
//     ...product,
//     //id: product.id,
//     id: this.firestore.createId(),
//     cantidad: qty,
//   };

//   // Agregar el producto al carrito
//   this.firestore.collection('cart').doc(productToCart.id).set(productToCart);
// }
