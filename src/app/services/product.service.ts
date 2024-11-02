import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  catchError,
  finalize,
  from,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { Product } from '../models/product-model';
import { AgrupacionProducto } from '../models/group-product.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private firestore: AngularFirestore) {}

  obtenerProductos(): Observable<any> {
    return this.firestore
      .collection('products', (ref) => ref.orderBy('cantidad', 'asc'))
      .snapshotChanges();
  }

  crearProducto(content: any): Observable<any> {
    return from(this.firestore.collection('products').add(content));
  }

  editarProducto(id: string, data: any): Observable<void> {
    return from(this.firestore.collection('products').doc(id).update(data));
  }

  eliminarProducto(id: string): Promise<any> {
    return this.firestore.collection('products').doc(id).delete();
  }

  updateProductStock(productId: string, newStock: number): Promise<void> {
    return this.firestore
      .collection('products')
      .doc(productId)
      .update({ cantidad: newStock });
  }

  obtenerId(id: string): Observable<any> {
    return this.firestore.collection('products').doc(id).snapshotChanges();
  }

  groupProductsByName(): Observable<AgrupacionProducto[]> {
    return this.firestore
      .collection<Product>('products', (ref) => ref.orderBy('nombre'))
      .snapshotChanges()
      .pipe(
        map((actions: any[]) => {
          const productos: Product[] = actions.map((a) => {
            const data = a.payload.doc.data() as Product;
            const id = a.payload.doc.id;
            return { ...data, id };
          });

          const groupedProducts: Record<string, AgrupacionProducto> = {};

          productos.forEach((producto) => {
            // Limpiar espacios y convertir a minúsculas
            const nombreLimpio = producto.nombre.trim().toLowerCase();
            const { cantidad, imagen, categoria } = producto;

            if (!groupedProducts[nombreLimpio]) {
              groupedProducts[nombreLimpio] = {
                nombre: producto.nombre.trim(), // Mantén la capitalización original para mostrar
                productos: [],
                totalCantidad: 0,
                imagen,
                categoria,
              };
            }

            groupedProducts[nombreLimpio].productos.push(producto);
            groupedProducts[nombreLimpio].totalCantidad += cantidad;
          });

          return Object.values(groupedProducts);
        }),
        catchError((error: any) => {
          console.error('Error al agrupar productos:', error);
          return [];
        })
      );
  }

  //NEW

  generateSKU(product: Product): string {
    // Asegúrate de que las propiedades existen antes de acceder a ellas
    // const idOriginal = product.id.substring(16, 20).toUpperCase(); Valor por defecto
    const marca = product.nombre
      ? product.nombre.substring(0, 3).toUpperCase()
      : 'N/A'; // Valor por defecto
    const modelo = product.modelo
      ? product.modelo.substring(0, 3).toUpperCase()
      : 'N/A'; // Valor por defecto
    const color = product.color
      ? product.color.substring(0, 3).toUpperCase()
      : 'N/A'; // Valor por defecto
    const talle = product.talle || 'N/A'; // Valor por defecto

    // Combinar para crear el SKU
    // const sku = `${modelo}-${color}-${talle}-${idOriginal}`;
    const sku = `${marca}-${modelo}-${talle}-${color}`;
    return sku;
  }

  getProductByCode(scannedCode: string): Observable<Product | null> {
    return this.firestore
      .collection<Product>('products', (ref) =>
        ref.where('barcode', '==', scannedCode)
      )
      .snapshotChanges()
      .pipe(
        map((actions: any[]) => {
          if (actions.length > 0) {
            const product = actions[0].payload.doc.data() as Product;
            product.id = actions[0].payload.doc.id; // Añadir el ID del producto
            return product;
          } else {
            return null; // Producto no encontrado
          }
        }),
        catchError((error: any) => {
          console.error('Error al obtener el producto por código:', error);
          return of(null); // Manejo de error
        })
      );
  }
}
