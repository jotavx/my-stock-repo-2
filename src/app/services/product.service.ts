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
      .collection('products', (ref) => ref.orderBy('nombre', 'asc'))
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
            const { nombre, cantidad, imagen, categoria } = producto;

            if (!groupedProducts[nombre]) {
              groupedProducts[nombre] = {
                nombre,
                productos: [],
                totalCantidad: 0,
                imagen,
                categoria,
              };
            }

            groupedProducts[nombre].productos.push(producto);
            groupedProducts[nombre].totalCantidad += cantidad;
          });

          return Object.values(groupedProducts);
        }),
        catchError((error: any) => {
          console.error('Error al agrupar productos:', error);
          return [];
        })
      );
  }
}
