import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Product } from '../models/product-model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StockAlertService {
  constructor(private firestore: AngularFirestore) {}

  observarStockBajo(): Observable<{ productos: Product[]; cantidad: number }> {
    return this.firestore
      .collection<Product>('products', (ref) => ref.where('cantidad', '<=', 5))
      .valueChanges({ idField: 'id' })
      .pipe(
        map((productos: Product[]) => {
          const cantidad = productos.length;
          if (cantidad > 0) {
            // Aquí podrías mostrar una alerta o notificación
            // console.warn('Productos con stock bajo:', productos);
          }
          return { productos, cantidad };
        })
      );
  }
}
